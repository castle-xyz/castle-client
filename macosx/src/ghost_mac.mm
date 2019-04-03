#import "ghost.h"
#import "ghost_constants.h"

#import "GhostAppDelegate.h"
#import "GhostFileSystem.h"

#import <sstream>

#pragma mark - internal

extern __weak NSWindow *ghostMacMainWindow;
extern __weak NSWindow *ghostMacChildWindow;

extern "C" NSWindow *ghostMacGetMainWindow() { return ghostMacMainWindow; }

extern "C" void ghostMacSetMainWindow(NSWindow *window) { ghostMacMainWindow = window; }

static void _ghostSendNativeOpenUrlEvent(const char *uri) {
  std::stringstream params;
  params << "{ url: '" << uri << "' }";
  ghostSendJSEvent(kGhostOpenUrlEventName, params.str().c_str());
}

typedef enum GhostOpenPanelAction {
  kGhostOpenPanelActionChooseNewProjectDirectory,
  kGhostOpenPanelActionOpenProjectFile,
} GhostOpenPanelAction;

void _configureOpenPanelForAction(NSOpenPanel *openPanel, GhostOpenPanelAction action) {
  [openPanel setAllowsMultipleSelection:NO];
  [openPanel setCanCreateDirectories:YES];
  switch (action) {
  case kGhostOpenPanelActionOpenProjectFile: {
    [openPanel setCanChooseDirectories:NO];
    [openPanel setCanChooseFiles:YES];
    // delegate shouldEnableUrl is possible as well
    [openPanel setAllowedFileTypes:@[ @"castle", @"lua" ]];
    break;
  }
  case kGhostOpenPanelActionChooseNewProjectDirectory: {
    [openPanel setCanChooseDirectories:YES];
    [openPanel setCanChooseFiles:NO];
    break;
  }
  }
  // NOTE: we might want [openPanel setDirectoryURL:]
}

static bool ghostIsShowingNativeModal = false;

NSModalResponse _runNativeModal(NSSavePanel *panel) {
  ghostIsShowingNativeModal = true;
  NSModalResponse response = [panel runModal];
  ghostIsShowingNativeModal = false;
  return response;
}

#pragma mark - macos implementation of ghost.h

static float childLeft = 0, childTop = 0, childWidth = 200, childHeight = 200;

float ghostGetChildLeft() { return childLeft; }
float ghostGetChildTop() { return childTop; }
float ghostGetChildWidth() { return childWidth; }
float ghostGetChildHeight() { return childHeight; }

static BOOL browserReady = NO;
static char *initialUri = NULL;

// Child windows are hidden on creation (see 'SDL_cocoawindow.m') then made visible after
// the first time bounds are set. This prevents an initial render with wrong bounds.
static bool hidden = true;
static bool explicitlyHidden = false;

void ghostSetChildWindowVisible(bool visible) {
  explicitlyHidden = !visible;
  dispatch_async(dispatch_get_main_queue(), ^{
    if (ghostMacMainWindow && ghostMacChildWindow && visible == hidden) {
      hidden = !visible;
      if (visible) {
        [ghostMacMainWindow addChildWindow:ghostMacChildWindow ordered:NSWindowAbove];
        [ghostMacChildWindow setIsVisible:YES];
      } else {
        [ghostMacChildWindow setIsVisible:NO];
      }
    }
  });
}

GHOST_EXPORT bool ghostGetBackgrounded() {
  if (!ghostMacChildWindow) {
    return false;
  }
  if (explicitlyHidden) {
    return true;
  }
  return !([ghostMacMainWindow isKeyWindow] or [ghostMacChildWindow isKeyWindow]);
}

static BOOL isFullscreen = NO;

GHOST_EXPORT void ghostSetChildWindowFullscreen(bool fullscreen) {
  // Same as previous state? Skip...
  if (fullscreen == isFullscreen) {
    return;
  }
  // At this point we can assume we're toggling the state

  NSWindow *mainWindow = ghostMacGetMainWindow();
  if (!mainWindow) {
    return;
  }
  static __weak NSWindow *lastFullscreenedChildWindow = nil;
  if (fullscreen) { // Entering fullscreen
    if (ghostMacChildWindow) {
      // NOTE: Order of operations is super important here!
      [mainWindow removeChildWindow:ghostMacChildWindow];
      [ghostMacChildWindow setCollectionBehavior:NSWindowCollectionBehaviorFullScreenPrimary];
      [ghostMacChildWindow toggleFullScreen:ghostMacChildWindow];
      lastFullscreenedChildWindow = ghostMacChildWindow;
      [ghostMacChildWindow makeKeyWindow];
      isFullscreen = YES;
      [mainWindow setIsVisible:NO];
    }
  } else {
    if (lastFullscreenedChildWindow) {
      // NOTE: Order of operations is super important here!
      [lastFullscreenedChildWindow toggleFullScreen:lastFullscreenedChildWindow];
      [lastFullscreenedChildWindow setCollectionBehavior:NSWindowCollectionBehaviorManaged];
      [mainWindow setIsVisible:YES];
      [mainWindow addChildWindow:lastFullscreenedChildWindow ordered:NSWindowAbove];
      [mainWindow makeMainWindow];
      [mainWindow makeKeyWindow];
      isFullscreen = NO;
      lastFullscreenedChildWindow = nil;
    }
  }
}

GHOST_EXPORT bool ghostGetChildWindowFullscreen() { return isFullscreen; }

void ghostSetChildWindowFrame(float left, float top, float width, float height) {
  if (isFullscreen) {
    return;
  }
  left = fmax(0, left);
  top = fmax(0, top);

  childLeft = left;
  childTop = top;
  childWidth = width;
  childHeight = height;

  if (ghostMacMainWindow) {
    if (ghostMacChildWindow) {
      width = fmin(width, ghostMacMainWindow.contentLayoutRect.size.width - left);
      height = fmin(height, ghostMacMainWindow.contentLayoutRect.size.height - top);

      CGRect frame;
      frame.origin.x = ghostMacMainWindow.frame.origin.x + left;
      frame.origin.y = ghostMacMainWindow.frame.origin.y +
                       ghostMacMainWindow.contentLayoutRect.size.height - top - height;
      frame.size.width = width;
      frame.size.height = height;
      [ghostMacChildWindow setFrame:frame display:NO];

      // Focus-follows-mouse
      NSPoint mouse = [NSEvent mouseLocation];
      if (frame.origin.x <= mouse.x && mouse.x <= frame.origin.x + width &&
          frame.origin.y <= mouse.y && mouse.y <= frame.origin.y + height) {
        if (![ghostMacChildWindow isKeyWindow]) {
          [ghostMacChildWindow makeKeyWindow];
        }
      } else if (![ghostMacMainWindow isKeyWindow]) {
        [ghostMacMainWindow makeKeyWindow];
      }
    } else if (![ghostMacMainWindow isKeyWindow] && !ghostIsShowingNativeModal) {
      [ghostMacMainWindow makeKeyWindow];
    }
  }
}

void ghostResizeChildWindow(float dw, float dh) {
  ghostSetChildWindowFrame(childLeft, childTop, childWidth + dw, childHeight + dh);
}

void ghostUpdateChildWindowFrame() {
  ghostSetChildWindowFrame(childLeft, childTop, childWidth, childHeight);
}

void ghostHandleOpenUri(const char *uri) {
  if (browserReady) {
    _ghostSendNativeOpenUrlEvent(uri);
  } else {
    initialUri = strdup(uri);
  }
}

void ghostOpenLoveUri(const char *uri) {
  NSString *uriStr = [NSString stringWithCString:uri encoding:NSUTF8StringEncoding];
  dispatch_async(dispatch_get_main_queue(), ^{
    hidden = true;
    explicitlyHidden = false;
    GhostAppDelegate *delegate = [NSApplication sharedApplication].delegate;
    [delegate stopLove];
    [delegate bootLoveWithUri:uriStr];
  });
}

void ghostOpenExternalUrl(const char *url) {
  NSString *urlStr = [NSString stringWithCString:url encoding:NSUTF8StringEncoding];
  NSURL *macUrl = [NSURL URLWithString:urlStr];
  if (macUrl) { // will be nil if invalid
    [[NSWorkspace sharedWorkspace] openURL:macUrl];
  }
}

void ghostClose() {
  dispatch_async(dispatch_get_main_queue(), ^{
    GhostAppDelegate *delegate = [NSApplication sharedApplication].delegate;
    [delegate stopLove];
  });
}

void ghostSetBrowserReady() {
  browserReady = YES;
  if (initialUri) {
    _ghostSendNativeOpenUrlEvent(initialUri);
    free(initialUri);
    initialUri = NULL;
  }
}

bool ghostChooseDirectoryWithDialog(const char *title, const char *message, const char *action,
                                    const char **result) {
  const char *chosenPathCStr = NULL;
  NSOpenPanel *openPanel = [NSOpenPanel openPanel];
  [openPanel setTitle:[NSString stringWithCString:title encoding:NSUTF8StringEncoding]];
  [openPanel setPrompt:[NSString stringWithCString:action encoding:NSUTF8StringEncoding]];
  [openPanel setMessage:[NSString stringWithCString:message encoding:NSUTF8StringEncoding]];
  _configureOpenPanelForAction(openPanel, kGhostOpenPanelActionChooseNewProjectDirectory);
  NSModalResponse response = _runNativeModal(openPanel);
  if (response == NSFileHandlingPanelOKButton) {
    NSURL *url = [[openPanel URLs] lastObject];
    chosenPathCStr = [[url path] cStringUsingEncoding:NSUTF8StringEncoding];
  }
  if (chosenPathCStr) {
    *result = strdup(chosenPathCStr);
    return true;
  }
  return false;
}

bool ghostShowOpenProjectDialog(const char **projectFilePathChosen) {
  const char *chosenPathCStr = NULL;
  NSOpenPanel *openPanel = [NSOpenPanel openPanel];
  [openPanel setTitle:@"Open a Castle Project"];
  [openPanel setPrompt:@"Open Project"];
  [openPanel setMessage:@"Select a Castle Project file to open"];
  _configureOpenPanelForAction(openPanel, kGhostOpenPanelActionOpenProjectFile);
  NSModalResponse response = _runNativeModal(openPanel);
  if (response == NSFileHandlingPanelOKButton) {
    NSURL *url = [[openPanel URLs] lastObject];
    chosenPathCStr = [[url path] cStringUsingEncoding:NSUTF8StringEncoding];
  }
  if (chosenPathCStr) {
    *projectFilePathChosen = strdup(chosenPathCStr);
    return true;
  }
  return false;
}

static bool applicationWillTerminateNotificationPosted = false;

void ghostQuitMessageLoop() {
  if (!applicationWillTerminateNotificationPosted) {
    [[NSNotificationCenter defaultCenter]
        postNotificationName:NSApplicationWillTerminateNotification
                      object:nil];
    applicationWillTerminateNotificationPosted = true;
  }
}

bool ghostGetPathToFileInAppBundle(const char *filename, const char **result) {
  NSString *_filename = [NSString stringWithCString:filename encoding:NSUTF8StringEncoding];
  NSString *path = [GhostFileSystem pathToFileInAppBundle:_filename];
  const char *pathStr = NULL;
  if (path) {
    pathStr = [path cStringUsingEncoding:NSUTF8StringEncoding];
  }
  if (pathStr) {
    *result = strdup(pathStr);
    return true;
  }
  return false;
}

bool ghostGetDocumentsPath(const char **result) {
  NSString *path = [GhostFileSystem ghostDocumentsDirectory];
  const char *pathStr = NULL;
  if (path) {
    pathStr = [path cStringUsingEncoding:NSUTF8StringEncoding];
  }
  if (pathStr) {
    *result = strdup(pathStr);
    return true;
  }
  return false;
}

void ghostInstallUpdate() {
  GhostAppDelegate *delegate = (GhostAppDelegate *)([NSApplication sharedApplication].delegate);
  [delegate installUpdate];
}

void ghostShowDesktopNotification(const char *title, const char *body) {
  NSString *_title = [NSString stringWithCString:title encoding:NSUTF8StringEncoding];
  NSString *_body = [NSString stringWithCString:body encoding:NSUTF8StringEncoding];

  dispatch_async(dispatch_get_main_queue(), ^{
    NSUserNotification *notification = [[NSUserNotification alloc] init];
    [notification setTitle:_title];
    [notification setInformativeText:_body];
    [notification setSoundName:nil];

    NSUserNotificationCenter *center = [NSUserNotificationCenter defaultUserNotificationCenter];
    GhostAppDelegate *delegate = (GhostAppDelegate *)([NSApplication sharedApplication].delegate);
    [center setDelegate:delegate];
    [center deliverNotification:notification];
  });
}

// TODO: don't use static
static std::string execNodeResult = "";
const char *ghostExecNode(const char *input) {
  const char *pathToBundledFile;
  if (!ghostGetPathToFileInAppBundle("castle-desktop-node-macos", &pathToBundledFile)) {
    return NULL;
  }
  std::string command = pathToBundledFile;
  command += " ";
  command += input;
  FILE *pipe = popen(command.c_str(), "r");

  if (!pipe) {
    return nullptr;
  }

  // TODO: handle failure

  char buffer[128];
  execNodeResult = "";
  try {
    while (fgets(buffer, sizeof buffer, pipe) != NULL) {
      execNodeResult += buffer;
    }
  } catch (...) {
    pclose(pipe);
    return nullptr;
  }
  pclose(pipe);

  return execNodeResult.c_str();
}
