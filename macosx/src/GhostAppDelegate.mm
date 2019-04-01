#import "GhostAppDelegate.h"
#import "GhostEnv.h"
#import "GhostMainMenu.h"
#import "ghost.h"
#import "ghost_constants.h"

extern "C" {
#include <lauxlib.h>
#include <lua.h>
#include <lualib.h>
}

#include <SDL.h>

#include "modules/love/love.h"
#include "modules/thread/Channel.h"
#include "modules/timer/Timer.h"

#import <Sparkle/SUAppcastItem.h>
#import <Sparkle/SUUpdater.h>

#define HAVE_OBSCONFIG_H
#include <obs.h>

#include "simple_handler.h"

extern "C" NSWindow *ghostMacGetMainWindow();
extern __weak NSWindow *ghostMacChildWindow;

@interface GhostAppDelegate ()

@property(nonatomic, strong) NSInvocation *updateImmediateInstallationInvocation;

@property(nonatomic, assign) lua_State *luaState;
@property(nonatomic, assign) int loveBootStackPos;
@property(nonatomic, assign) BOOL lovePaused;
@property(nonatomic, assign) BOOL loveStepping;

@property(nonatomic, strong) NSTimer *mainLoopTimer;

@property(nonatomic, assign) BOOL windowEventsSubscribed;
@property(nonatomic, assign) CGRect prevWindowFrame;

@end

@implementation GhostAppDelegate

- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(__unused NSApplication *)sender {
  return NO;
}

// Create the application on the UI thread
- (void)createApplication:(__unused id)object {
  [NSApplication sharedApplication];
  [NSApplication sharedApplication].mainMenu = [GhostMainMenu makeMainMenu];

  // Set the delegate for application events
  [[NSApplication sharedApplication] setDelegate:self];

  // Initialize Sparkle. Also force an update check 5 seconds after boot.
  if (![GhostEnv disableUpdatesEntirely]) {
    if ([GhostEnv shouldCheckForUpdatesInDevMode] ||
        ![[[NSBundle mainBundle] infoDictionary][@"CFBundleVersion"]
            isEqualToString:@"VERSION_UNSET"]) {
      auto updater = [SUUpdater sharedUpdater];
      updater.automaticallyChecksForUpdates = YES;
      updater.automaticallyDownloadsUpdates =
          YES; // Force Sparkle to assume the user checked this box
      updater.delegate = self;
      self.updateImmediateInstallationInvocation = nil;
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(5 * NSEC_PER_SEC)),
                     dispatch_get_main_queue(), ^{
                       [[SUUpdater sharedUpdater] checkForUpdatesInBackground];
                     });
    }
  }

  // Initialize Lua / game loop stuff
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

  
  
  
  NSString * obsPluginsPath = [NSString stringWithFormat:@"%@/obs/obs-plugins", [[NSBundle mainBundle] resourcePath]];
  NSString * obsPluginsDataPath = [NSString stringWithFormat:@"%@/obs/data/obs-plugins", [[NSBundle mainBundle] resourcePath]];
  
  obs_startup("en-US", [obsPluginsPath UTF8String], NULL);
  
  obs_add_module_path([obsPluginsPath UTF8String], [obsPluginsDataPath UTF8String]);
  obs_load_all_modules();
  obs_post_load_modules();
  
  //printf(OBS_INSTALL_DATA_PATH);
  
  struct obs_video_info tmp_v;
  struct obs_audio_info tmp_a;
  
  NSString *libobsOpenGLPath = [[NSBundle mainBundle] pathForResource:@"obs/bin/libobs-opengl" ofType:@"so"];
  tmp_v.graphics_module = [libobsOpenGLPath UTF8String];
  tmp_v.fps_num = 30000;
  tmp_v.fps_den = 1001; //30 fps
  tmp_v.base_width = 1280;
  tmp_v.base_height = 720;
  tmp_v.output_width = 1280; //No scaling yet
  tmp_v.output_height = 720; //No scaling yet
  tmp_v.output_format = VIDEO_FORMAT_NV12; //YUV420
  tmp_v.adapter = 0; //Video adapter id
  tmp_v.gpu_conversion = true;
  tmp_v.colorspace = VIDEO_CS_601;
  tmp_v.range = VIDEO_RANGE_PARTIAL;
  tmp_v.scale_type = OBS_SCALE_BICUBIC;
  
  tmp_a.samples_per_sec = 44100; //Somewhat classic 44.1KHz
  tmp_a.speakers = SPEAKERS_STEREO; //2.0: FL, FR
  
  obs_reset_audio(&tmp_a);
  obs_reset_video(&tmp_v);
  
  int idx = 0;
  while (true) {
    const char * ty;
    if (!obs_enum_output_types(idx, &ty)) {
      break;
    }
    
    printf(ty);
    printf("\n");
    
    idx++;
  }
  
  printf("\n\n\n");
  idx = 0;
  while (true) {
    const char * ty;
    if (!obs_enum_encoder_types(idx, &ty)) {
      break;
    }
    
    printf(ty);
    printf("\n");
    
    idx++;
  }
  
  printf("\n\n\n");
  idx = 0;
  while (true) {
    const char * ty;
    if (!obs_enum_service_types(idx, &ty)) {
      break;
    }
    
    printf(ty);
    printf("\n");
    
    idx++;
  }
  
  printf("\n\n\n");
  idx = 0;
  while (true) {
    const char * ty;
    if (!obs_enum_source_types(idx, &ty)) {
      break;
    }
    
    printf(ty);
    printf("\n");
    
    idx++;
  }
  
  obs_source_t * tmp_source = obs_get_source_by_name("display_capture");
  obs_encoder_t * tmp_encoder = obs_get_encoder_by_name("obs_x264");
  obs_output_t * tmp_output = obs_get_output_by_name("flv_output");
  
  //obs_service_t tmp_service;
  
  obs_data_t *newSettings = obs_data_create();
  obs_data_set_string(newSettings, "path", "/Users/jesseruder/ghost/ghost/test.flv");
  obs_output_update(tmp_output, newSettings);
  
  obs_data_t *settings = obs_output_get_settings(tmp_output);
  const char * path = obs_data_get_string(settings, "path");
  printf("\n\n\n\npath: ");
  printf(path);
  printf("\n\n\n\n");
  
  
  // https://obsproject.com/docs/frontends.html
  obs_set_output_source(0, tmp_source);
  
  obs_encoder_set_video(tmp_encoder, obs_get_video());
  //obs_encoder_set_audio(my_aac_encoder, obs_get_audio());
  obs_output_set_video_encoder(tmp_output, tmp_encoder);
  //obs_output_set_audio_encoder(my_output, my_aac_encoder);
  //obs_output_set_service(&tmp_output, &tmp_service); // if a stream
  obs_output_start(tmp_output);
}

- (NSApplicationTerminateReply)applicationShouldTerminate:(__unused NSApplication *)sender {
  return NSTerminateNow;
}

- (void)application:(__unused NSApplication *)application
          openFiles:(nonnull NSArray<NSString *> *)filenames {
  for (NSString *filename in filenames) {
    ghostHandleOpenUri(filename.UTF8String);
  }
}

- (BOOL)application:(__unused NSApplication *)application openFile:(nonnull NSString *)filename {
  ghostHandleOpenUri(filename.UTF8String);
  return YES;
}

- (void)application:(__unused NSApplication *)application
           openURLs:(nonnull NSArray<NSURL *> *)urls {
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
    // Detect whether a new child window was created
    bool prevChild = !!ghostMacChildWindow;
    [self stepLove];                         // Actually run Love for one step
    if (!prevChild && ghostMacChildWindow) { // New child window!
      // Add as child, make visible and focus
      ghostResizeChildWindow(0, 0);
      ghostSetChildWindowVisible(true);
      [ghostMacChildWindow makeKeyWindow];

      // Force resize after small delay to fix a weird issue on Mojave
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 80 * NSEC_PER_MSEC),
                     dispatch_get_main_queue(), ^{
                       ghostResizeChildWindow(-1, -1);
                       ghostResizeChildWindow(1, 1);
                     });
    }
  }

  if (!self.windowEventsSubscribed) {
    NSWindow *window = ghostMacGetMainWindow();
    if (window) {
      [[NSNotificationCenter defaultCenter] addObserver:self
                                               selector:@selector(windowResized:)
                                                   name:NSWindowDidResizeNotification
                                                 object:window];
      self.prevWindowFrame = window.frame;

      // XXX(nikki): Disabling pausing on window resignment for now...
      //      [[NSNotificationCenter defaultCenter] addObserver:self
      //                                               selector:@selector(windowDidBecomeKey:)
      //                                                   name:NSWindowDidBecomeKeyNotification
      //                                                 object:window];
      //      [[NSNotificationCenter defaultCenter] addObserver:self
      //                                               selector:@selector(windowDidResignKey:)
      //                                                   name:NSWindowDidResignKeyNotification
      //                                                 object:window];

      self.windowEventsSubscribed = YES;
    }
  }

  ghostUpdateChildWindowFrame();
}

- (void)stopLove {
  ghostSetChildWindowFullscreen(false);
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
  if ([ghostMacChildWindow isKeyWindow] && self.luaState && self.loveStepping) {
    Cocoa_DispatchEvent(event);
  }
}

- (void)tryToTerminateApplication:(__unused NSApplication *)app {
  [self stopLove];

  SimpleHandler *handler = SimpleHandler::GetInstance();
  if (handler && !handler->IsClosing())
    handler->CloseAllBrowsers(false);
}

- (void)windowResized:(__unused NSNotification *)notification {
  NSWindow *window = ghostMacGetMainWindow();
  float dw = window.frame.size.width - self.prevWindowFrame.size.width;
  float dh = window.frame.size.height - self.prevWindowFrame.size.height;
  ghostResizeChildWindow(dw, dh);
  self.prevWindowFrame = window.frame;
}

- (void)windowDidBecomeKey:(__unused NSNotification *)notification {
  // Step timer so that next frame's `dt` doesn't include time spent paused
  auto timer = love::Module::getInstance<love::timer::Timer>(love::Module::M_TIMER);
  if (timer) {
    timer->step();
  }

  self.lovePaused = NO;
}

- (void)windowDidResignKey:(__unused NSNotification *)notification {
  self.lovePaused = YES;
}

- (void)updater:(__unused SUUpdater *)updater
            willInstallUpdateOnQuit:(SUAppcastItem *)item
    immediateInstallationInvocation:(NSInvocation *)invocation {
  self.updateImmediateInstallationInvocation = invocation;
  [self sendJSUpdateAvailableEventForAppcastItem:item];
}

- (void)sendJSUpdateAvailableEventForAppcastItem:(SUAppcastItem *)item {
  // `item` has the following properties:
  //   @property (copy, readonly) NSString *title;
  //   @property (copy, readonly) NSString *dateString;
  //   @property (copy, readonly) NSString *itemDescription;
  //   @property (strong, readonly) NSURL *releaseNotesURL;
  //   @property (strong, readonly) SUSignatures *signatures;
  //   @property (copy, readonly) NSString *minimumSystemVersion;
  //   @property (copy, readonly) NSString *maximumSystemVersion;
  //   @property (strong, readonly) NSURL *fileURL;
  //   @property (nonatomic, readonly) uint64_t contentLength;
  //   @property (copy, readonly) NSString *versionString;
  //   @property (copy, readonly) NSString *osString;
  //   @property (copy, readonly) NSString *displayVersionString;
  //   @property (copy, readonly) NSDictionary *deltaUpdates;
  //   @property (strong, readonly) NSURL *infoURL;
  std::stringstream params;
  params << "{"
         << " title: \"" << std::string([item.title UTF8String]) << "\", "
         << " dateString: \"" << std::string([item.dateString UTF8String]) << "\", "
         << " versionString: \"" << std::string([item.versionString UTF8String]) << "\", ";
  if (item.itemDescription) {
    params << " itemDescription: \"" << std::string([item.itemDescription UTF8String]) << "\", ";
  }
  if (item.releaseNotesURL) {
    params << " releaseNotesURL: \""
           << std::string([item.releaseNotesURL.absoluteString UTF8String]) << "\", ";
  }
  if (item.infoURL) {
    params << " infoURL: \"" << std::string([item.infoURL.absoluteString UTF8String]) << "\", ";
  }
  params << "}";
  ghostSendJSEvent(kGhostUpdateAvailableEventName, params.str().c_str());
}

- (void)installUpdate {
  // If already downloaded and extracted, run that immediately, else download and run
  if (self.updateImmediateInstallationInvocation) {
    [self.updateImmediateInstallationInvocation invoke];
  } else {
    [[SUUpdater sharedUpdater] installUpdatesIfAvailable];
  }
}

- (BOOL)userNotificationCenter:(NSUserNotificationCenter *)center
     shouldPresentNotification:(NSUserNotification *)notification {
  return YES;
}

@end
