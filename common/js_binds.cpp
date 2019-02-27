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

JS_BIND_DEFINE(setWindowFrameFullscreen) {
  float isFullscreen = arg["isFullscreen"];
  ghostSetChildWindowFullscreen(isFullscreen);
  success("success");
}

JS_BIND_DEFINE(getWindowFrameFullscreen) {
  success(ghostGetChildWindowFullscreen() ? "true" : "false");
}

JS_BIND_DEFINE(readChannels) {
  static lua_State *conversionLuaState = lua_open();

  auto response = json::object();

  for (const std::string &channelName : arg["channelNames"]) {
    response[channelName] = json::array();
    auto channel = love::thread::Channel::getChannel(channelName);
    love::Variant var;
    while (channel->pop(&var)) {
      assert(var.getType() == love::Variant::STRING || var.getType() == love::Variant::SMALLSTRING);
      var.toLua(conversionLuaState);
      std::string str(luaL_checkstring(conversionLuaState, -1));
      response[channelName].push_back(str);
      lua_pop(conversionLuaState, 1);
    }
  }

  success(response.dump());
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

JS_BIND_DEFINE(writeChannels) {
  auto channelData = arg["channelData"];
  for (auto it = channelData.begin(); it != channelData.end(); ++it) {
    std::string name = it.key();
    auto channel = love::thread::Channel::getChannel(name);
    for (std::string val : it.value()) {
      // Explicitly pass `.length()` because `val` may be in UTF-8
      channel->push(love::Variant(val.c_str(), val.length()));
    }
  }
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
