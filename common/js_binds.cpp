#include "js_binds.h"

#include <fstream>
#include <sstream>
#include <string>
#include <unordered_map>

namespace JSBinds {

// If `function` is not `nullptr`, puts it at `name` in the registry and returns it.
// If `function` is `nullptr`, returns the `Function` previously put at `name` in the registry.
static Function accessRegistry(const char *name, Function function) {
  static auto registry = new std::unordered_map<std::string, Function>();
  if (function) {
    (*registry)[std::string(name)] = function;
  } else {
    function = (*registry)[std::string(name)];
  }
  return function;
}

Register::Register(const char *name, Function function) { accessRegistry(name, function); }

Function find(const char *name) { return accessRegistry(name, nullptr); }

} // namespace JSBinds

#include "ghost.h"
#include "ghost_constants.h"

#include "modules/thread/Channel.h"

// Three names are defined in function bodies:
//   `arg`: a `json` passed as the argument
//   `success`: call this with a string to send back a successful response
//   `failure`: call this with a string to send back an error message

JS_BIND_DEFINE(installUpdate) {
  ghostInstallUpdate();
  success("success");
}

// initiates a file download at the given url.
// After CEF assigns an ID to this download, SimpleHandler will send JS events for
// start|progress|finish for the given ID.
JS_BIND_DEFINE(downloadFile) {
  const std::string url = arg["url"];
  ghostDownloadFile(url.c_str());
}

JS_BIND_DEFINE(cancelDownload) {
  const unsigned int downloadId = arg["downloadId"];
  ghostCancelDownload(downloadId);
}

JS_BIND_DEFINE(chooseDirectoryWithDialog) {
  const char *result;

  const std::string &title = arg["title"];
  const std::string &message = arg["message"];
  const std::string &action = arg["action"];

  bool didChooseDirectory =
      ghostChooseDirectoryWithDialog(title.c_str(), message.c_str(), action.c_str(), &result);
  if (didChooseDirectory) {
    success(result);
    std::free((void *)result);
  } else {
    failure("Unable to choose directory");
  }
}

JS_BIND_DEFINE(chooseOpenProjectPathWithDialog) {
  const char *result;

  bool didChooseDirectory = ghostShowOpenProjectDialog(&result);
  if (didChooseDirectory) {
    success(result);
    std::free((void *)result);
  } else {
    failure("Unable to choose open project path");
  }
}

JS_BIND_DEFINE(getDocumentsPath) {
  const char *result;

  bool didFindPath = ghostGetDocumentsPath(&result);
  if (didFindPath) {
    success(result);
    std::free((void *)result);
  } else {
    failure("Unable to get documents directory");
  }
}

JS_BIND_DEFINE(createProjectAtPath) {
  const std::string path = arg["path"];
  const char *entryPoint;
  bool didCreate = ghostCreateProjectAtPath(path.c_str(), &entryPoint);
  if (didCreate) {
    success(entryPoint);
    std::free((void *)entryPoint);
  } else {
    failure("Unable to create project");
  }
}

JS_BIND_DEFINE(openUri) {
  std::string uri = arg["uri"];
  ghostOpenLoveUri(uri.c_str());
  success("success");
}

JS_BIND_DEFINE(close) {
  ghostClose();
  success("success");
}

JS_BIND_DEFINE(setChildWindowFrame) {
  float left = arg["left"];
  float top = arg["top"];
  float width = arg["width"];
  float height = arg["height"];
  ghostSetChildWindowFrame(left, top, width, height);
  success("success");
}

JS_BIND_DEFINE(setWindowFrameVisible) {
  float isVisible = arg["isVisible"];
  ghostSetChildWindowVisible(isVisible);
  success("success");
}

JS_BIND_DEFINE(setSystemScalingEnabled) {
  bool isSystemScalingEnabled = arg["isSystemScalingEnabled"];
  ghostApplyGlobalScaling = isSystemScalingEnabled;
  success("success");
}

JS_BIND_DEFINE(setWindowFrameFullscreen) {
  float isFullscreen = arg["isFullscreen"];
  ghostSetChildWindowFullscreen(isFullscreen);
  success("success");
}

JS_BIND_DEFINE(getWindowFrameFullscreen) {
  success(ghostGetChildWindowFullscreen() ? "true" : "false");
}

JS_BIND_DEFINE(browserReady) {
  ghostSetBrowserReady();
  success("success");
}

JS_BIND_DEFINE(openExternalUrl) {
  std::string url = arg["url"];
  ghostOpenExternalUrl(url.c_str());
  success("success");
}

JS_BIND_DEFINE(sendLuaEvent) {
  std::string jsonified = arg["jsonified"];
  auto channel = love::thread::Channel::getChannel("JS_EVENTS");
  // Explicitly pass `.length()` because `val` may be in UTF-8
  channel->push(love::Variant(jsonified.c_str(), jsonified.length()));
}

JS_BIND_DEFINE(readFile) {
  std::string filepath = arg["filepath"];
  std::ifstream t(filepath);
  std::stringstream buffer;
  buffer << t.rdbuf();
  success(buffer.str());
}

bool hasEnding(std::string const &fullString, std::string const &ending) {
  if (fullString.length() >= ending.length()) {
    return (0 ==
            fullString.compare(fullString.length() - ending.length(), ending.length(), ending));
  } else {
    return false;
  }
}

JS_BIND_DEFINE(writeCastleFile) {
  std::string filepath = arg["filepath"];
  std::string contents = arg["contents"];
  std::stringstream error;
  if (hasEnding(filepath, ".castle")) {
    std::ofstream t;
    t.open(filepath);
    if (t.is_open()) {
      t << contents << "\n";
      t.close();
      if (t.bad()) {
        error << "Failed to write Castle file at path " << filepath;
        failure(error.str());
      } else {
        success("success");
      }
      return;
    }
  }
  error << "Failed to open Castle file at path " << filepath;
  failure(error.str());
}

JS_BIND_DEFINE(removeCastleFile) {
  std::string filepath = arg["filepath"];
  if (hasEnding(filepath, ".castle")) {
    int result = std::remove(filepath.c_str());
    if (result == 0) {
      success("success");
      return;
    }
  }
  std::stringstream error;
  error << "Failed to remove Castle file at path " << filepath;
  failure(error.str());
}

JS_BIND_DEFINE(showDesktopNotification) {
  std::string title = arg["title"];
  std::string body = arg["body"];
  ghostShowDesktopNotification(title.c_str(), body.c_str());
  success("success");
}

JS_BIND_DEFINE(execNode) {
  std::string input = arg["input"];
  std::string result = ghostExecNode(input.c_str());
  success(result);
}
