#import "NSApplication+Ghost.h"

#include "ghost.h"
#include <string>

@implementation NSApplication (Ghost)

- (void)openProjectWithDialog:(__unused id)sender
{
  const char *result;

  bool didChooseDirectory = ghostChooseDirectoryWithDialog("Open a Castle Project", "Select a Castle Project file to open", "Open Project", &result);
  if (didChooseDirectory) {
    NSLog(@"chose directory: %s", result);
    std::free((void *)result);
  } else {
    NSLog(@"fail");
  }
}

@end
