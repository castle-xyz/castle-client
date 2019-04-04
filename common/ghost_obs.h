#ifndef __GHOST_OBS_H__
#define __GHOST_OBS_H__

#include <string>

void ghostInitObs(std::string basePath, std::string ffmpegPath, bool debug = false);
bool ghostStartObs();
void ghostStopObs();
void ghostTakeScreenCaptureObs();

#endif
