//  Copyright © 2016 650 Industries, Inc. All rights reserved.

#import "AppDelegate.h"
#import <UIKit/UIKit.h>

// UNUSED because SDL defines its own `main` in `SDL_uikitappdelegate.m`
int UNUSED_main(int argc, char *argv[]) {
  @autoreleasepool {
    return UIApplicationMain(argc, argv, nil,
                             NSStringFromClass([AppDelegate class]));
  }
}
