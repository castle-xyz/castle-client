// Copyright 2015-present 650 Industries. All rights reserved.

#import "AppDelegate.h"
#import "EXViewController.h"
#import "ExpoKit.h"

#include <SDL.h>

#import "../../../ghost-extensions/SDL2-2.0.8/src/video/uikit/SDL_uikitappdelegate.h"

@import Firebase;

@implementation SDLUIKitDelegate (Zorro)

// SDL defines its own `int main(...)` function:
// https://github.com/spurious/SDL-mirror/blob/5d7cfcca344034aff9327f77fc181ae3754e7a90/src/video/uikit/SDL_uikitappdelegate.m#L45-L70.
// We tell it to use our `AppDelegate` class instead.
+ (NSString *)getAppDelegateClassName {
  return NSStringFromClass([AppDelegate class]);
}

@end

int SDL_main(int argc, char *argv[]) {
  // Implement a dummy `SDL_main()` to satisfy the linker.
  return 0;
}

@interface AppDelegate ()

@property(nonatomic, strong) EXViewController *rootViewController;
@property(nonatomic, strong) SDLUIKitDelegate *sdlDelegate;

@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application
    didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  _window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  _window.backgroundColor = [UIColor whiteColor];
  [[ExpoKit sharedInstance] application:application
          didFinishLaunchingWithOptions:launchOptions];
  _rootViewController = [ExpoKit sharedInstance].rootViewController;
  _window.rootViewController = _rootViewController;

  [_window makeKeyAndVisible];

  // SDL
  self.sdlDelegate = [[SDLUIKitDelegate alloc] init];
  [self.sdlDelegate hideLaunchScreen];
  SDL_SetMainReady();
  SDL_iPhoneSetEventPump(SDL_FALSE);

  // Firebase
  [FIRApp configure];

  return YES;
}

#pragma mark - Handling URLs

- (BOOL)application:(UIApplication *)application
              openURL:(NSURL *)url
    sourceApplication:(nullable NSString *)sourceApplication
           annotation:(id)annotation {
  return [[ExpoKit sharedInstance] application:application
                                       openURL:url
                             sourceApplication:sourceApplication
                                    annotation:annotation];
}

- (BOOL)application:(UIApplication *)application
    continueUserActivity:(nonnull NSUserActivity *)userActivity
      restorationHandler:
          (nonnull void (^)(NSArray *_Nullable))restorationHandler {
  return [[ExpoKit sharedInstance] application:application
                          continueUserActivity:userActivity
                            restorationHandler:restorationHandler];
}

#pragma mark - Notifications

- (void)application:(UIApplication *)application
    didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)token {
  [[ExpoKit sharedInstance] application:application
      didRegisterForRemoteNotificationsWithDeviceToken:token];
}

- (void)application:(UIApplication *)application
    didFailToRegisterForRemoteNotificationsWithError:(NSError *)err {
  [[ExpoKit sharedInstance] application:application
      didFailToRegisterForRemoteNotificationsWithError:err];
}

- (void)application:(UIApplication *)application
    didReceiveRemoteNotification:(NSDictionary *)notification {
  [[ExpoKit sharedInstance] application:application
           didReceiveRemoteNotification:notification];
}

- (void)application:(UIApplication *)application
    didReceiveLocalNotification:(nonnull UILocalNotification *)notification {
  [[ExpoKit sharedInstance] application:application
            didReceiveLocalNotification:notification];
}

- (void)application:(UIApplication *)application
    didRegisterUserNotificationSettings:
        (nonnull UIUserNotificationSettings *)notificationSettings {
  [[ExpoKit sharedInstance] application:application
      didRegisterUserNotificationSettings:notificationSettings];
}

- (void)applicationWillTerminate:(UIApplication *)application {
  [self.sdlDelegate applicationWillTerminate:application];
}

- (void)applicationDidReceiveMemoryWarning:(UIApplication *)application {
  [self.sdlDelegate applicationDidReceiveMemoryWarning:application];
}

- (void)application:(UIApplication *)application
    didChangeStatusBarOrientation:
        (UIInterfaceOrientation)oldStatusBarOrientation {
  [self.sdlDelegate application:application
      didChangeStatusBarOrientation:oldStatusBarOrientation];
}

- (void)applicationWillResignActive:(UIApplication *)application {
  [self.sdlDelegate applicationWillResignActive:application];
}

- (void)applicationDidEnterBackground:(UIApplication *)application {
  [self.sdlDelegate applicationDidEnterBackground:application];
}

- (void)applicationWillEnterForeground:(UIApplication *)application {
  [self.sdlDelegate applicationWillEnterForeground:application];
}

- (void)applicationDidBecomeActive:(UIApplication *)application {
  [self.sdlDelegate applicationDidBecomeActive:application];
}

@end
