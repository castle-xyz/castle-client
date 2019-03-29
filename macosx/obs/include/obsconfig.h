
#pragma once

#ifndef ON
#define ON 1
#endif

#ifndef OFF
#define OFF 0
#endif

#define OBS_VERSION "23.1.0-rc1-1-gd18c62b2"
#define OBS_DATA_PATH "../data"
#define OBS_INSTALL_PREFIX ""
#define OBS_PLUGIN_DESTINATION "obs-plugins"
#define OBS_RELATIVE_PREFIX "../"
#define OBS_UNIX_STRUCTURE 0
#define BUILD_CAPTIONS OFF
#define HAVE_DBUS 0
#define HAVE_PULSEAUDIO 0
#define USE_XINPUT 0
#define LIBOBS_IMAGEMAGICK_DIR_STYLE_6L 6
#define LIBOBS_IMAGEMAGICK_DIR_STYLE_7GE 7
#define LIBOBS_IMAGEMAGICK_DIR_STYLE 

/* NOTE: Release candidate version numbers internally are always the previous
 * main release number!  For example, if the current public release is 21.0 and
 * the build is 22.0 release candidate 1, internally the build number (defined
 * by LIBOBS_API_VER/etc) will always be 21.0, despite the OBS_VERSION string
 * saying "22.0 RC1".
 *
 * If the release candidate version number is 0.0.0 and the RC number is 0,
 * that means it's not a release candidate build. */
#define OBS_RELEASE_CANDIDATE_MAJOR 0
#define OBS_RELEASE_CANDIDATE_MINOR 0
#define OBS_RELEASE_CANDIDATE_PATCH 0
#define OBS_RELEASE_CANDIDATE_VER \
	MAKE_SEMANTIC_VERSION(OBS_RELEASE_CANDIDATE_MAJOR, \
	                      OBS_RELEASE_CANDIDATE_MINOR, \
	                      OBS_RELEASE_CANDIDATE_PATCH)
#define OBS_RELEASE_CANDIDATE 0
