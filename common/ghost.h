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
GHOST_EXPORT void ghostFocusChat();
void ghostFocusGame();

enum {
  GHOST_SCALING_OFF = 0,
  GHOST_SCALING_ON = 1,
  GHOST_SCALING_STEP = 2,
};

extern bool ghostScreenSettingsDirty;
GHOST_EXPORT void ghostSetDimensions(float width, float height);
void ghostGetDimensions(float *width, float *height);
GHOST_EXPORT float ghostGetWidth();
GHOST_EXPORT float ghostGetHeight();
GHOST_EXPORT void ghostSetScalingModes(int up, int down);
void ghostGetScalingModes(int *up, int *down);

void ghostGetGameFrame(float frameLeft, float frameTop, float frameWidth, float frameHeight,
                       float *gameLeft, float *gameTop, float *gameWidth, float *gameHeight);
GHOST_EXPORT void ghostDoneLoading();

bool ghostChooseDirectoryWithDialog(const char *title, const char *message, const char *action,
                                    const char **result);
bool ghostShowOpenProjectDialog(const char **projectFilePathChosen);
bool ghostCreateProjectAtPath(const char *path, const char **entryPoint);
bool ghostGetPathToFileInAppBundle(const char *filename, const char **result);
bool ghostGetDocumentsPath(const char **result);
bool ghostGetVersion(const char **result);
void ghostExecNode(const char *input, int execId);
void ghostSetCpuMonitoring(bool isMonitoringCpu);

void ghostInstallUpdate();

void ghostTakeScreenCapture();
const char *ghostGetCachePath();

extern double ghostGlobalScaling;
extern double ghostScreenScaling;
GHOST_EXPORT double ghostGetGlobalScaling();
GHOST_EXPORT double ghostGetScreenScaling();
extern bool ghostApplyGlobalScaling;
extern bool ghostApplyScreenScaling;

extern bool ghostChildWindowCloseEventReceived;

#ifdef __cplusplus
}
#endif

#endif
