#import "NSApplication+Ghost.h"

#include "ghost.h"
#include "ghost_constants.h"

#include <string>

NSString *const kNativeMenuFileOpenAction = @"file.open";

@implementation NSApplication (Ghost)

- (void)openProject:(__unused id)sender {
  [self _sendJSNativeMenuEventWithAction:kNativeMenuFileOpenAction];
}

- (void)_sendJSNativeMenuEventWithAction:(NSString *)action {
  NSString *params = [NSString stringWithFormat:@"{ action: \"%@\" }", action];
  ghostSendJSEvent(kGhostNativeMenuSelectedEventName,
                   [params cStringUsingEncoding:NSUTF8StringEncoding]);
}

@end
