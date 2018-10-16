#import "GhostAppDelegate.h"
#import "GhostMainMenu.h"
#import "ghost.h"

extern "C" {
#include <lauxlib.h>
#include <lua.h>
#include <lualib.h>
}

#include <SDL.h>

#include "modules/love/love.h"
#include "modules/thread/Channel.h"
#include "modules/timer/Timer.h"

#include "simple_handler.h"

@interface GhostAppDelegate ()

@property(nonatomic, assign) lua_State *luaState;
@property(nonatomic, assign) int loveBootStackPos;
@property(nonatomic, assign) BOOL lovePaused;
@property(nonatomic, assign) BOOL loveStepping;

@property(nonatomic, strong) NSTimer *mainLoopTimer;

@property(nonatomic, assign) BOOL windowEventsSubscribed;
@property(nonatomic, assign) CGRect prevWindowFrame;

@end

@implementation GhostAppDelegate

- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)sender {
  return NO;
}

// Create the application on the UI thread.
- (void)createApplication:(id)object {
  [NSApplication sharedApplication];
  [NSApplication sharedApplication].mainMenu = [GhostMainMenu makeMainMenu];

  // Set the delegate for application events.
  [[NSApplication sharedApplication] setDelegate:self];

  self.luaState = nil;

  self.mainLoopTimer = [NSTimer timerWithTimeInterval:1.0f / 60.0f
                                               target:self
                                             selector:@selector(stepMainLoop)
                                             userInfo:nil
                                              repeats:YES];
  [[NSRunLoop mainRunLoop] addTimer:self.mainLoopTimer forMode:NSRunLoopCommonModes];

  self.lovePaused = NO;
  self.loveStepping = NO;

  self.windowEventsSubscribed = NO;
}

- (NSApplicationTerminateReply)applicationShouldTerminate:(NSApplication *)sender {
  return NSTerminateNow;
}

- (void)application:(NSApplication *)application
          openFiles:(nonnull NSArray<NSString *> *)filenames {
  for (NSString *filename in filenames) {
    ghostHandleOpenUri(filename.UTF8String);
  }
}

- (BOOL)application:(NSApplication *)application openFile:(nonnull NSString *)filename {
  ghostHandleOpenUri(filename.UTF8String);
}

- (void)application:(NSApplication *)application openURLs:(nonnull NSArray<NSURL *> *)urls {
  for (NSURL *url in urls) {
    ghostHandleOpenUri([url.absoluteString UTF8String]);
  }
}

- (void)bootLoveWithUri:(NSString *)uri {
  // Create the virtual machine.
  lua_State *L = luaL_newstate();
  luaL_openlibs(L);

  // Add love to package.preload for easy requiring.
  lua_getglobal(L, "package");
  lua_getfield(L, -1, "preload");
  lua_pushcfunction(L, luaopen_love);
  lua_setfield(L, -2, "love");
  lua_pop(L, 2);

  // Add command line arguments to global arg (like stand-alone Lua).
  {
    lua_newtable(L);

    lua_pushstring(L, "love");
    lua_rawseti(L, -2, -2);

    lua_pushstring(L, "embedded boot.lua");
    lua_rawseti(L, -2, -1);

    NSArray *bundlepaths = [[NSBundle mainBundle] pathsForResourcesOfType:@"love" inDirectory:nil];
    if (bundlepaths.count > 0) {
      lua_pushstring(L, [bundlepaths[0] UTF8String]);
      lua_rawseti(L, -2, 0);
      lua_pushstring(L, "--fused");
      lua_rawseti(L, -2, 1);
    }

    lua_setglobal(L, "arg");
  }

  // require "love"
  lua_getglobal(L, "require");
  lua_pushstring(L, "love");
  lua_call(L, 1, 1); // leave the returned table on the stack.

  // Add love._exe = true.
  // This indicates that we're running the standalone version of love, and not
  // the library version.
  {
    lua_pushboolean(L, 1);
    lua_setfield(L, -2, "_exe");
  }

  // Pop the love table returned by require "love".
  lua_pop(L, 1);

  // require "love.boot" (preloaded when love was required.)
  lua_getglobal(L, "require");
  lua_pushstring(L, "love.boot");
  lua_call(L, 1, 1);

  // Turn the returned boot function into a coroutine and leave it at the top of
  // the stack
  lua_newthread(L);
  lua_pushvalue(L, -2);
  self.loveBootStackPos = lua_gettop(L);
  self.luaState = L;

  // If `uri` is given, set it as the global variable `GHOST_ROOT_URI`
  if (uri) {
    lua_pushstring(L, uri.UTF8String);
    lua_setglobal(L, "GHOST_ROOT_URI");
  }
  
  // Not paused to start
  self.lovePaused = NO;
}

- (void)stepLove {
  if (self.luaState) {
    // Call the coroutine at the top of the stack
    lua_State *L = self.luaState;
    if (lua_resume(L, 0) == LUA_YIELD) {
      self.loveStepping = YES;
      lua_pop(L, lua_gettop(L) - self.loveBootStackPos);
    } else {
      self.loveStepping = NO;
      [self closeLua];
    }
  } else {
    self.loveStepping = NO;
  }
}

- (void)stepMainLoop {
  if (!self.lovePaused) {
    [self stepLove];
  }

  if (!self.windowEventsSubscribed) {
    NSWindow *window = [[NSApplication sharedApplication] mainWindow];
    if (window) {
      [[NSNotificationCenter defaultCenter] addObserver:self
                                               selector:@selector(windowResized:)
                                                   name:NSWindowDidResizeNotification
                                                 object:window];
      self.prevWindowFrame = window.frame;

      [[NSNotificationCenter defaultCenter] addObserver:self
                                               selector:@selector(windowDidBecomeKey:)
                                                   name:NSWindowDidBecomeKeyNotification
                                                 object:window];
      [[NSNotificationCenter defaultCenter] addObserver:self
                                               selector:@selector(windowDidResignKey:)
                                                   name:NSWindowDidResignKeyNotification
                                                 object:window];

      self.windowEventsSubscribed = YES;
    }
  }

  ghostUpdateChildWindowFrame();
}

- (void)stopLove {
  if (self.luaState) {
    SDL_Event quitEvent;
    quitEvent.type = SDL_QUIT;
    SDL_PushEvent(&quitEvent);
    [self stepLove];
    [self closeLua];
  }
  self.loveStepping = NO;
}

- (void)closeLua {
  if (self.luaState) {
    lua_State *L = self.luaState;
    self.luaState = nil;
    lua_close(L);
  }
}

// XXX(Ghost): Make this available for external use...
extern "C" {
  void Cocoa_DispatchEvent(NSEvent *theEvent);
}

- (void)sendEvent:(NSEvent *)event {
  if (self.luaState && self.loveStepping) {
    Cocoa_DispatchEvent(event);
  }
}

- (void)tryToTerminateApplication:(NSApplication *)app {
  [self stopLove];

  SimpleHandler *handler = SimpleHandler::GetInstance();
  if (handler && !handler->IsClosing())
    handler->CloseAllBrowsers(false);
}

- (void)windowResized:(NSNotification *)notification {
  NSWindow *window = [[NSApplication sharedApplication] mainWindow];
  float dw = window.frame.size.width - self.prevWindowFrame.size.width;
  float dh = window.frame.size.height - self.prevWindowFrame.size.height;
  ghostResizeChildWindow(dw, dh);
  self.prevWindowFrame = window.frame;
}

- (void)windowDidBecomeKey:(NSNotification *)notification {
  // Step timer so that next frame's `dt` doesn't include time spent paused
  auto timer = love::Module::getInstance<love::timer::Timer>(love::Module::M_TIMER);
  if (timer) {
    timer->step();
  }

  self.lovePaused = NO;
}

- (void)windowDidResignKey:(NSNotification *)notification {
  self.lovePaused = YES;
}

@end
