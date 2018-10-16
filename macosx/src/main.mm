#import <Cocoa/Cocoa.h>

#import "GhostAppDelegate.h"
#import "GhostEnv.h"
#import "GhostFileSystem.h"

#include "include/cef_application_mac.h"
#include "include/wrapper/cef_helpers.h"
#include "simple_app.h"
#include "simple_handler.h"

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

- (void)sendEvent:(NSEvent *)event {
  GhostAppDelegate *delegate = static_cast<GhostAppDelegate *>([NSApp delegate]);
  [delegate sendEvent:event];
  {
    CefScopedSendingEvent sendingEventScoper;
    [super sendEvent:event];
  }
}

- (void)terminate:(id)sender {
  GhostAppDelegate *delegate = static_cast<GhostAppDelegate *>([NSApp delegate]);
  [delegate tryToTerminateApplication:self];
  // Return, don't exit. The application is responsible for exiting on its own.
}

@end

// Entry point function for the browser process.
int main(int argc, char *argv[]) {
  // Provide CEF with command-line arguments.
  CefMainArgs main_args(argc, argv);

  @autoreleasepool {
    // Initialize the SimpleApplication instance.
    [SimpleApplication sharedApplication];

    CefSettings settings;
    NSString *cachePath = [GhostFileSystem ghostCachesDirectory];
    if (cachePath) {
      // allows Local Storage to work
      CefString(&settings.cache_path).FromASCII([cachePath UTF8String]);
    }
    settings.background_color = CefColorSetARGB(255, 0, 0, 0);

    // SimpleApp implements application-level callbacks for the browser process.
    // It will create the first browser instance in OnContextInitialized() after
    // CEF has initialized.

    NSString *initialUrl = [GhostEnv initialCastleUrl];
    NSSize screenSize = [NSScreen mainScreen].visibleFrame.size;
    screenSize.width = MIN(screenSize.width, 1440);
    screenSize.height = MIN(screenSize.height, 877);
    CefRefPtr<SimpleApp> app(
        new SimpleApp(std::string([initialUrl UTF8String]), screenSize.width, screenSize.height));

    // Initialize CEF for the browser process.
    CefInitialize(main_args, settings, app.get(), NULL);

    // Create the application delegate.
    NSObject *delegate = [[GhostAppDelegate alloc] init];
    [delegate performSelectorOnMainThread:@selector(createApplication:)
                               withObject:nil
                            waitUntilDone:NO];
    [SimpleApplication sharedApplication].delegate = delegate;

    // Run the CEF message loop. This will block until CefQuitMessageLoop() is
    // called.
    CefRunMessageLoop();

    // Shut down CEF.
    CefShutdown();
  }

  return 0;
}
