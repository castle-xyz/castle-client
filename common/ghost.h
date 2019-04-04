#ifndef __GHOST_H__
#define __GHOST_H__

#include <string>

#ifdef _MSC_VER
#define GHOST_EXPORT extern "C" __declspec(dllexport)
#else
#define GHOST_EXPORT extern "C" __attribute__((visibility("default")))
#endif

#ifdef __cplusplus
extern "C" {
#endif

// handler for when the user opened any ghost url from native code.
void ghostHandleOpenUri(const char *uri);

// boot a love instance with the given initial uri.
void ghostOpenLoveUri(const char *uri);

// tell the operating system to open a url in the user's browser.
void ghostOpenExternalUrl(const char *url);

// dispatch a JS Event with the given name and params.
GHOST_EXPORT void ghostSendJSEvent(const char *eventName, const char *serializedParams);

// download project files to the specified path.
void ghostDownloadFile(const char *fromUrl);

// cancel a file download initiated by `ghostDownloadFile()`.
// the download id is given in a JS event named kGhostFileDownloadEventName after the download has
// started.
bool ghostCancelDownload(unsigned int downloadId);

void ghostQuitMessageLoop();
void ghostClose();
void ghostUpdateChildWindowFrame();
void ghostResizeChildWindow(float dw, float dh);
void ghostSetChildWindowFrame(float left, float top, float width, float height);
void ghostSetChildWindowVisible(bool visible);
void ghostSetChildWindowFullscreen(bool fullscreen);
bool ghostGetChildWindowFullscreen();
void ghostSetBrowserReady();
void ghostShowDesktopNotification(const char *title, const char *body);
GHOST_EXPORT bool ghostGetBackgrounded();

bool ghostChooseDirectoryWithDialog(const char *title, const char *message, const char *action,
                                    const char **result);
bool ghostShowOpenProjectDialog(const char **projectFilePathChosen);
bool ghostCreateProjectAtPath(const char *path, const char **entryPoint);
bool ghostGetPathToFileInAppBundle(const char *filename, const char **result);
bool ghostGetDocumentsPath(const char **result);
const char *ghostExecNode(const char *input);

void ghostInstallUpdate();

float ghostGetChildLeft();
float ghostGetChildTop();
float ghostGetChildWidth();
float ghostGetChildHeight();

void ghostTakeScreenCapture();
const char *ghostGetCachePath();

extern double ghostGlobalScaling;
GHOST_EXPORT double ghostGetGlobalScaling();
extern bool ghostApplyGlobalScaling;

extern bool ghostChildWindowCloseEventReceived;

#ifdef __cplusplus
}
#endif

#endif
