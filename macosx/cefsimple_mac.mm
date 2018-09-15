// Copyright (c) 2013 The Chromium Embedded Framework Authors.
// Portions copyright (c) 2010 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#import <Cocoa/Cocoa.h>

extern "C" {
#include <lauxlib.h>
#include <lua.h>
#include <lualib.h>
}

#include <SDL.h>
#include <SDL_syswm.h>

#include "include/cef_application_mac.h"
#include "include/wrapper/cef_helpers.h"
#include "simple_app.h"
#include "simple_handler.h"

#include "modules/love/love.h"

#include "ghost.h"

// Receives notifications from the application.
@interface SimpleAppDelegate : NSObject <NSApplicationDelegate>

@property(nonatomic, assign) lua_State *luaState;
@property(nonatomic, assign) int loveBootStackPos;

@property(nonatomic, strong) NSTimer *mainLoopTimer;

- (void)createApplication:(id)object;
- (void)tryToTerminateApplication:(NSApplication *)app;
@end

// Provide the CefAppProtocol implementation required by CEF.
@interface SimpleApplication : NSApplication <CefAppProtocol> {
@private
  BOOL handlingSendEvent_;
}
@end

@implementation SimpleApplication
- (BOOL)isHandlingSendEvent {
  return handlingSendEvent_;
}

- (void)setHandlingSendEvent:(BOOL)handlingSendEvent {
  handlingSendEvent_ = handlingSendEvent;
}

// XXX(Ghost): Make this available for external use...
extern "C" {
void Cocoa_DispatchEvent(NSEvent *theEvent);
}

- (void)sendEvent:(NSEvent *)event {
  CefScopedSendingEvent sendingEventScoper;
  Cocoa_DispatchEvent(event);
  [super sendEvent:event];
}

- (void)terminate:(id)sender {
  SimpleAppDelegate *delegate = static_cast<SimpleAppDelegate *>([NSApp delegate]);
  [delegate tryToTerminateApplication:self];
  // Return, don't exit. The application is responsible for exiting on its own.
}
@end

@implementation SimpleAppDelegate

+ (NSMenu *)makeMainMenu {
  NSMenu *mainMenu = [[NSMenu alloc] init];
  NSMenuItem *mainMenuItem =
      [[NSMenuItem alloc] initWithTitle:@"Application" action:nil keyEquivalent:@""];
  [mainMenu addItem:mainMenuItem];

  NSMenu *appMenu = [[NSMenu alloc] init];
  mainMenuItem.submenu = appMenu;

  NSMenuItem *quitItem =
      [[NSMenuItem alloc] initWithTitle:@"Quit" action:@selector(terminate:) keyEquivalent:@"q"];
  quitItem.target = [NSApplication sharedApplication];
  [appMenu addItem:quitItem];
  return mainMenu;
}

- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)sender {
  return YES;
}

// Create the application on the UI thread.
- (void)createApplication:(id)object {
  [NSApplication sharedApplication];
  [NSApplication sharedApplication].mainMenu = [[self class] makeMainMenu];

  // Set the delegate for application events.
  [[NSApplication sharedApplication] setDelegate:self];

  // Love test
  self.luaState = nil;
  //  [self bootLoveWithUri:nil];
  self.mainLoopTimer = [NSTimer timerWithTimeInterval:1.0f / 60.0f
                                               target:self
                                             selector:@selector(stepLove)
                                             userInfo:nil
                                              repeats:YES];
  [[NSRunLoop mainRunLoop] addTimer:self.mainLoopTimer forMode:NSRunLoopCommonModes];
}

- (NSApplicationTerminateReply)applicationShouldTerminate:(NSApplication *)sender {
  return NSTerminateNow;
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
}

static BOOL resizeSubscribed = NO;
static float prevWindowWidth, prevWindowHeight;
static float childLeft = 0, childTop = 0, childWidth = 200, childHeight = 200;

- (void)stepLove {
  if (self.luaState) {
    // Call the coroutine at the top of the stack
    lua_State *L = self.luaState;
    if (lua_resume(L, 0) == LUA_YIELD) {
      lua_pop(L, lua_gettop(L) - self.loveBootStackPos);
    } else {
      [self closeLua];
    }
  }

  if (!resizeSubscribed) {
    NSWindow *window = [[NSApplication sharedApplication] mainWindow];
    if (window) {
      [[NSNotificationCenter defaultCenter] addObserver:self
                                               selector:@selector(windowResized:)
                                                   name:NSWindowDidResizeNotification
                                                 object:window];
      prevWindowWidth = window.frame.size.width;
      prevWindowHeight = window.frame.size.height;
      resizeSubscribed = YES;
    }
  }

  ghostSetChildWindowFrame(childLeft, childTop, childWidth, childHeight);
}

- (void)windowResized:(NSNotification *)notification {
  NSWindow *window = [[NSApplication sharedApplication] mainWindow];
  float dw = window.frame.size.width - prevWindowWidth;
  float dh = window.frame.size.height - prevWindowHeight;
  ghostSetChildWindowFrame(childLeft, childTop, childWidth + dw, childHeight + dh);
  prevWindowWidth = window.frame.size.width;
  prevWindowHeight = window.frame.size.height;
}

- (void)closeLua {
  if (self.luaState) {
    lua_State *L = self.luaState;
    self.luaState = nil;
    lua_close(L);
  }
}

- (void)tryToTerminateApplication:(NSApplication *)app {
  [self closeLua];

  SimpleHandler *handler = SimpleHandler::GetInstance();
  if (handler && !handler->IsClosing())
    handler->CloseAllBrowsers(false);
}

@end

// macOS implementation of 'ghost.h'

void ghostSetChildWindowFrame(float left, float top, float width, float height) {
  childLeft = left;
  childTop = top;
  childWidth = width;
  childHeight = height;

  NSWindow *window = [[NSApplication sharedApplication] mainWindow];
  if (window) {
    CGRect frame;
    frame.origin.x = window.frame.origin.x + left;
    frame.origin.y = window.frame.origin.y + window.contentLayoutRect.size.height - top - height;
    frame.size.width = width;
    frame.size.height = height;

    for (NSWindow *childWindow in window.childWindows) {
      [childWindow setFrame:frame display:NO];
    }
  }
}

void ghostOpenUri(const char *uri) {
  NSString *uriStr = [NSString stringWithCString:uri encoding:NSUTF8StringEncoding];
  dispatch_async(dispatch_get_main_queue(), ^{
    SimpleAppDelegate *delegate = [NSApplication sharedApplication].delegate;
    [delegate closeLua];
    [delegate bootLoveWithUri:uriStr];
  });
}

void ghostClose() {
  dispatch_async(dispatch_get_main_queue(), ^{
    SimpleAppDelegate *delegate = [NSApplication sharedApplication].delegate;
    [delegate closeLua];
  });
}

// Entry point function for the browser process.
int main(int argc, char *argv[]) {
  // Provide CEF with command-line arguments.
  CefMainArgs main_args(argc, argv);

  @autoreleasepool {
    // Initialize the SimpleApplication instance.
    [SimpleApplication sharedApplication];

    // Specify CEF global settings here.
    CefSettings settings;

    // SimpleApp implements application-level callbacks for the browser process.
    // It will create the first browser instance in OnContextInitialized() after
    // CEF has initialized.

    // use embedded index.html if it exists.
    NSString *indexPath = [[NSBundle mainBundle] pathForResource:@"index" ofType:@"html"];
    std::string initialUrl = "http://localhost:3000";
    if (indexPath && indexPath.length) {
      indexPath = [NSString stringWithFormat:@"file://%@", indexPath];
      initialUrl = std::string([indexPath UTF8String]);
    } else {
      initialUrl = "http://www.google.com";
    }
    NSSize screenSize = [NSScreen mainScreen].visibleFrame.size;
    screenSize.width = MIN(screenSize.width, 1440);
    screenSize.height = MIN(screenSize.height, 877);
    CefRefPtr<SimpleApp> app(new SimpleApp(initialUrl, screenSize.width, screenSize.height));

    // Initialize CEF for the browser process.
    CefInitialize(main_args, settings, app.get(), NULL);

    // Create the application delegate.
    NSObject *delegate = [[SimpleAppDelegate alloc] init];
    [delegate performSelectorOnMainThread:@selector(createApplication:)
                               withObject:nil
                            waitUntilDone:NO];

    // Run the CEF message loop. This will block until CefQuitMessageLoop() is
    // called.
    CefRunMessageLoop();

    // Shut down CEF.
    CefShutdown();
  }

  return 0;
}
