// Copyright (c) 2013 The Chromium Embedded Framework Authors.
// Portions copyright (c) 2010 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#import <Cocoa/Cocoa.h>

#include <SDL.h>
#include <SDL_syswm.h>

#import "GhostAppDelegate.h"

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
    NSObject *delegate = [[GhostAppDelegate alloc] init];
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
