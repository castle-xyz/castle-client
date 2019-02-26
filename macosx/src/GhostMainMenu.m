#import "GhostMainMenu.h"
#import "NSApplication+Ghost.h"

@implementation GhostMainMenu

+ (NSMenu *)makeMainMenu {
  NSMenu *mainMenu = [[NSMenu alloc] init];

  // application menu
  NSMenuItem *appMenuItem =
      [[NSMenuItem alloc] initWithTitle:@"Application" action:nil keyEquivalent:@""];
  [mainMenu addItem:appMenuItem];

  NSMenu *appMenu = [[NSMenu alloc] init];
  appMenuItem.submenu = appMenu;

  NSMenuItem *hideItem =
      [[NSMenuItem alloc] initWithTitle:@"Hide Castle" action:@selector(hide:) keyEquivalent:@"h"];
  [appMenu addItem:hideItem];
  NSMenuItem *quitItem =
      [[NSMenuItem alloc] initWithTitle:@"Quit" action:@selector(terminate:) keyEquivalent:@"q"];
  quitItem.target = [NSApplication sharedApplication];
  [appMenu addItem:quitItem];
  
  // file menu
  NSMenuItem *fileMenuItem =
  [[NSMenuItem alloc] initWithTitle:@"File" action:nil keyEquivalent:@""];
  [mainMenu addItem:fileMenuItem];
  
  NSMenu *fileMenu = [[NSMenu alloc] init];
  fileMenu.title = @"File";
  fileMenuItem.submenu = fileMenu;
  
  NSMenuItem *openItem =
  [[NSMenuItem alloc] initWithTitle:@"Open" action:@selector(openProjectWithDialog:) keyEquivalent:@"o"];
  openItem.target = [NSApplication sharedApplication];
  [fileMenu addItem:openItem];

  // edit menu
  NSMenuItem *editMenuItem =
      [[NSMenuItem alloc] initWithTitle:@"Edit" action:nil keyEquivalent:@""];
  [mainMenu addItem:editMenuItem];

  NSMenu *editMenu = [[NSMenu alloc] init];
  editMenu.title = @"Edit";
  editMenuItem.submenu = editMenu;

  NSMenuItem *cutItem =
      [[NSMenuItem alloc] initWithTitle:@"Cut" action:@selector(cut:) keyEquivalent:@"x"];
  [editMenu addItem:cutItem];
  NSMenuItem *copyItem =
      [[NSMenuItem alloc] initWithTitle:@"Copy" action:@selector(copy:) keyEquivalent:@"c"];
  [editMenu addItem:copyItem];
  NSMenuItem *pasteItem =
      [[NSMenuItem alloc] initWithTitle:@"Paste" action:@selector(paste:) keyEquivalent:@"v"];
  [editMenu addItem:pasteItem];
  NSMenuItem *selectAllItem = [[NSMenuItem alloc] initWithTitle:@"Select All"
                                                         action:@selector(selectAll:)
                                                  keyEquivalent:@"a"];
  [editMenu addItem:selectAllItem];

  // window menu
  NSMenuItem *windowMenuItem =
      [[NSMenuItem alloc] initWithTitle:@"Window" action:nil keyEquivalent:@""];
  [mainMenu addItem:windowMenuItem];

  NSMenu *windowMenu = [[NSMenu alloc] init];
  windowMenu.title = @"Window";
  windowMenuItem.submenu = windowMenu;
  NSMenuItem *minimizeItem = [[NSMenuItem alloc] initWithTitle:@"Minimize"
                                                        action:@selector(performMiniaturize:)
                                                 keyEquivalent:@"m"];
  [windowMenu addItem:minimizeItem];

  return mainMenu;
}

@end
