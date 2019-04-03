#include "ghost_obs.h"
#include "ghost.h"

#include <boost/filesystem/operations.hpp>
#include <boost/filesystem/path.hpp>
#include <graphics/vec2.h>
#include <obs.h>
#include <unistd.h>

obs_output_t *ghostObsOutput = NULL;
bool ghostObsIsStarted = false;

void ghostLoadObsModule(std::string basePath, std::string moduleName) {
  obs_module_t *module;
  std::string soPath = basePath + "/obs-plugins/" + moduleName + ".so";
  std::string dataPath = basePath + "/data/obs-plugins/" + moduleName;

  obs_open_module(&module, soPath.c_str(), dataPath.c_str());
  obs_init_module(module);
}

void ghostInitObs(std::string basePath, bool debug) {
  std::string obsPluginsPath = basePath + "/obs-plugins";
  std::string obsPluginsDataPath = basePath + "/data/obs-plugins";

  obs_startup("en-US", obsPluginsPath.c_str(), NULL);
  obs_add_module_path(obsPluginsPath.c_str(), obsPluginsDataPath.c_str());

  std::string obsLibDataPath = basePath + "/data/libobs/";
  castle_obs_set_data_path(obsLibDataPath.c_str());

  ghostLoadObsModule(basePath, "coreaudio-encoder");
  ghostLoadObsModule(basePath, "mac-capture");
  ghostLoadObsModule(basePath, "mac-vth264");
  ghostLoadObsModule(basePath, "obs-ffmpeg");
  ghostLoadObsModule(basePath, "obs-outputs");

  obs_post_load_modules();

  struct obs_video_info tmp_v;
  struct obs_audio_info tmp_a;

  std::string libobsOpenGLPath = basePath + "/bin/libobs-opengl.so";
  tmp_v.graphics_module = libobsOpenGLPath.c_str();
  tmp_v.fps_num = 30000;
  tmp_v.fps_den = 1001; // 30 fps
  tmp_v.base_width = 1280;
  tmp_v.base_height = 720;
  tmp_v.output_width = 1280;               // No scaling yet
  tmp_v.output_height = 720;               // No scaling yet
  tmp_v.output_format = VIDEO_FORMAT_NV12; // YUV420
  tmp_v.adapter = 0;                       // Video adapter id
  tmp_v.gpu_conversion = true;
  tmp_v.colorspace = VIDEO_CS_601;
  tmp_v.range = VIDEO_RANGE_PARTIAL;
  tmp_v.scale_type = OBS_SCALE_BICUBIC;

  tmp_a.samples_per_sec = 44100;    // Somewhat classic 44.1KHz
  tmp_a.speakers = SPEAKERS_STEREO; // 2.0: FL, FR

  obs_reset_audio(&tmp_a);
  obs_reset_video(&tmp_v);

  if (debug) {
    int idx = 0;
    while (true) {
      const char *ty;
      if (!obs_enum_output_types(idx, &ty)) {
        break;
      }

      printf(ty);
      printf("\n");

      idx++;
    }

    printf("\n\n\n");
    idx = 0;
    while (true) {
      const char *ty;
      if (!obs_enum_encoder_types(idx, &ty)) {
        break;
      }

      printf(ty);
      printf("\n");

      idx++;
    }

    printf("\n\n\n");
    idx = 0;
    while (true) {
      const char *ty;
      if (!obs_enum_service_types(idx, &ty)) {
        break;
      }

      printf(ty);
      printf("\n");

      idx++;
    }

    printf("\n\n\n");
    idx = 0;
    while (true) {
      const char *ty;
      if (!obs_enum_source_types(idx, &ty)) {
        break;
      }

      printf(ty);
      printf("\n");

      idx++;
    }
  }
}

bool ghostStartObs() {
  if (ghostObsIsStarted) {
    return true;
  }

  if (!ghostObsOutput) {
    // https://github.com/obsproject/obs-studio/blob/master/plugins/mac-capture/mac-window-capture.m
    // window_capture
    obs_data_t *sourceSettings = obs_data_create();
    obs_data_set_string(sourceSettings, "owner_name", "Castle");
    obs_data_set_string(sourceSettings, "window_name", "castle-player");
    obs_source_t *ghostObsSource =
        obs_source_create("window_capture", "castle_source", sourceSettings, NULL);

    // encoders
    // https://github.com/obsproject/obs-studio/blob/master/plugins/mac-vth264/encoder.c
    // need a keyframe every 10 seconds, otherwise the replay_buffer will never purge old frames
    obs_data_t *videoEncoderSettings = obs_data_create();
    obs_data_set_int(videoEncoderSettings, "keyint_sec", 10);
    obs_encoder_t *ghostObsVideoEncoder =
        obs_video_encoder_create("vt_h264_hw", "castle_encoder", videoEncoderSettings, NULL);

    obs_encoder_t *ghostObsAudioEncoder =
        obs_audio_encoder_create("CoreAudio_AAC", "castle_audio_encoder", NULL, 0, NULL);

    // obs-ffmpeg-mux.c window-basic-main-outputs.cpp
    std::string screenCaptureDirectory = ghostGetCachePath();
    screenCaptureDirectory += "/screen_captures";

    boost::filesystem::path dir(screenCaptureDirectory);
    boost::filesystem::create_directory(dir);

    obs_data_t *outputSettings = obs_data_create();
    obs_data_set_string(outputSettings, "directory", screenCaptureDirectory.c_str());
    obs_data_set_int(outputSettings, "max_time_sec", 10);
    obs_data_set_int(outputSettings, "max_size_mb", 10);

    ghostObsOutput = obs_output_create("replay_buffer", "castle_output", outputSettings, NULL);

    // https://obsproject.com/docs/frontends.html
    // https://obsproject.com/docs/frontends.html#initialization-and-shutdown
    obs_scene_t *scene = obs_scene_create("castle_scene");
    obs_sceneitem_t *window_capture_scene_item = obs_scene_add(scene, ghostObsSource);

    ////// SCENE TRANSFORM
    struct obs_transform_info transform_info;
    obs_sceneitem_get_info(window_capture_scene_item, &transform_info);

    vec2_set(&transform_info.pos, 0, 0);
    transform_info.bounds_type = OBS_BOUNDS_SCALE_INNER;
    transform_info.bounds_alignment = OBS_ALIGN_CENTER;
    vec2_set(&transform_info.bounds, ghostGetChildWidth(), ghostGetChildHeight());

    obs_sceneitem_set_info(window_capture_scene_item, &transform_info);
    ////// END SCENE TRANSFORM

    obs_set_output_source(0, obs_scene_get_source(scene));

    video_t *main_video = obs_get_video();
    audio_t *main_audio = obs_get_audio();
    obs_encoder_set_video(ghostObsVideoEncoder, main_video);
    obs_encoder_set_audio(ghostObsAudioEncoder, main_audio);

    obs_output_set_video_encoder(ghostObsOutput, ghostObsVideoEncoder);
    obs_output_set_audio_encoder(ghostObsOutput, ghostObsAudioEncoder, 0);
  }

  bool result = obs_output_start(ghostObsOutput);
  if (result) {
    ghostObsIsStarted = true;
  }

  return result;
}

void ghostStopObs() {
  if (!ghostObsIsStarted) {
    return;
  }

  obs_output_stop(ghostObsOutput);
  ghostObsIsStarted = false;
}

const char *ghostTakeScreenCaptureObs() {
  if (!ghostObsIsStarted) {
    return NULL;
  }

  proc_handler_t *proc_handler = obs_output_get_proc_handler(ghostObsOutput);
  proc_handler_call(proc_handler, "save", NULL);

  // 200ms
  usleep(1000 * 200);

  calldata_t *calldata = calldata_create();
  proc_handler_call(proc_handler, "get_last_replay", calldata);
  const char *path = calldata_string(calldata, "path");
  printf("path!!!:\n");
  printf(path);

  return path;
}