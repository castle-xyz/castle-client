#include "ghost.h"

#include <windows.h>

#include <mutex>
#include <queue>

extern "C" {
#include <lauxlib.h>
#include <lua.h>
#include <lualib.h>
}

#include <SDL.h>

#include "modules/love/love.h"
#include "modules/thread/Channel.h"
#include "modules/timer/Timer.h"

#include "simple_handler.h"
#include "ghost_constants.h"

// internal

static void _ghostSendNativeOpenUrlEvent(std::string uri) {
  std::string params = "{ url: '" + uri + "' }";
  ghostSendJSEvent(kGhostOpenUrlEventName.c_str(), params.c_str());
}

// win implementation of 'ghost.h'

static float childLeft = 0, childTop = 0, childWidth = 200, childHeight = 200;

static bool browserReady = false;
static std::string initialUri = "";

static lua_State *luaState = NULL;
static int loveBootStackPos = 0;
static bool lovePaused = false;

static bool shouldRunMessageLoop = true;

static std::mutex mutex;

enum MessageType {
  OPEN_LOVE_URI,
  SET_CHILD_WINDOW_FRAME,
  CLOSE,
};

struct Message {
  MessageType type;
  union MessageBody {
    struct OpenUriBody {
      char *uri;
    } openUri;
    struct SetChildWindowFrameBody {
      float left, top, width, height;
    } setChildWindowFrame;
  } body;
};

std::queue<Message> messages;

void ghostHandleOpenUri(const char *uri) {
  // Windows deep links add extra quotes around uri
  std::string stringUri = std::string(uri);
  if (stringUri.front() == '"' && stringUri.back() == '"') {
	stringUri = stringUri.substr(1, stringUri.length() - 2);
  }

  if (browserReady) {
	_ghostSendNativeOpenUrlEvent(stringUri);
  } else {
    initialUri = stringUri;
  }
}

void ghostOpenLoveUri(const char *uri) {
  std::lock_guard<std::mutex> guard(mutex);
  Message msg;
  msg.type = OPEN_LOVE_URI;
  msg.body.openUri.uri = strdup(uri);
  messages.push(msg);
}

void ghostSetChildWindowFrame(float left, float top, float width, float height) {
  std::lock_guard<std::mutex> guard(mutex);
  Message msg;
  msg.type = SET_CHILD_WINDOW_FRAME;
  msg.body.setChildWindowFrame = {left, top, width, height};
  messages.push(msg);
}

void ghostResizeChildWindow(float dw, float dh) { std::lock_guard<std::mutex> guard(mutex); }

void ghostUpdateChildWindowFrame() { std::lock_guard<std::mutex> guard(mutex); }

void ghostOpenUri(const char *uri) { std::lock_guard<std::mutex> guard(mutex); }

void ghostClose() {
  std::lock_guard<std::mutex> guard(mutex);
  Message msg;
  msg.type = CLOSE;
  messages.push(msg);
}

void ghostSetBrowserReady() {
  browserReady = true;
  if (!initialUri.empty()) {
    _ghostSendNativeOpenUrlEvent(initialUri);
    initialUri = "";
  }
}

extern "C" {
void ghostRunMessageLoop();
}

RECT prevParentRect = {0, 0, 0, 0};

static void bootLove(const char *uri) {
  // Create the virtual machine.
  lua_State *L = luaL_newstate();
  luaL_openlibs(L);

  // Add love to package.preload for easy requiring.
  lua_getglobal(L, "package");
  lua_getfield(L, -1, "preload");
  lua_pushcfunction(L, luaopen_love);
  lua_setfield(L, -2, "love");
  lua_pop(L, 2);

  // Add command line arguments to global arg (like stand-alone Lua).
  {
    lua_newtable(L);

    lua_pushstring(L, "love");
    lua_rawseti(L, -2, -2);

    lua_pushstring(L, "embedded boot.lua");
    lua_rawseti(L, -2, -1);

    CHAR buffer[MAX_PATH];
    GetModuleFileNameA(NULL, buffer, MAX_PATH);
    std::string::size_type pos = std::string(buffer).find_last_of("\\/");
    std::string path = std::string(buffer).substr(0, pos) + "/base";
    lua_pushstring(L, path.c_str());
    lua_rawseti(L, -2, 0);
    //  lua_pushstring(L, "--fused");
    //  lua_rawseti(L, -2, 1);

    lua_setglobal(L, "arg");
  }

  // require "love"
  lua_getglobal(L, "require");
  lua_pushstring(L, "love");
  lua_call(L, 1, 1); // leave the returned table on the stack.

  // Add love._exe = true.
  // This indicates that we're running the standalone version of love, and not
  // the library version.
  {
    lua_pushboolean(L, 1);
    lua_setfield(L, -2, "_exe");
  }

  // Pop the love table returned by require "love".
  lua_pop(L, 1);

  // require "love.boot" (preloaded when love was required.)
  lua_getglobal(L, "require");
  lua_pushstring(L, "love.boot");
  lua_call(L, 1, 1);

  // Turn the returned boot function into a coroutine and leave it at the top of
  // the stack
  lua_newthread(L);
  lua_pushvalue(L, -2);
  loveBootStackPos = lua_gettop(L);
  luaState = L;

  // If `uri` is given, set it as the global variable `GHOST_ROOT_URI`
  if (uri) {
    lua_pushstring(L, uri);
    lua_setglobal(L, "GHOST_ROOT_URI");
  }

  // Reset the previous window dimensions
  prevParentRect.right = 0;
  prevParentRect.left = 0;
}

void closeLua() {
  if (luaState) {
    lua_State *L = luaState;
    luaState = NULL;
    lua_close(L);
  }
}

void stepLove() {
  if (luaState) {
    // Call the coroutine at the top of the stack
    lua_State *L = luaState;
    if (lua_resume(L, 0) == LUA_YIELD) {
      lua_pop(L, lua_gettop(L) - loveBootStackPos);
    } else {
      closeLua();
    }
  }
}

void stopLove() {
  if (luaState) {
    SDL_Event quitEvent;
    quitEvent.type = SDL_QUIT;
    SDL_PushEvent(&quitEvent);
    stepLove();
    closeLua();
  }
}

extern "C" {
HWND ghostWinGetMainWindow();
HWND ghostWinGetChildWindow();
}

void ghostQuitMessageLoop() { shouldRunMessageLoop = false; }

void ghostStep() {
  // Process messages
  {
    while (true) {
      Message msg;
      {
        std::lock_guard<std::mutex> guard(mutex);
        if (messages.size() > 0) {
          msg = messages.front();
          messages.pop();
        } else {
          break;
        }
      }

      switch (msg.type) {
      case OPEN_LOVE_URI: {
        char *uri = msg.body.openUri.uri;
        stopLove();
        bootLove(uri);
        free(uri);
      } break;

      case SET_CHILD_WINDOW_FRAME: {
        childLeft = msg.body.setChildWindowFrame.left;
        childTop = msg.body.setChildWindowFrame.top;
        childWidth = msg.body.setChildWindowFrame.width;
        childHeight = msg.body.setChildWindowFrame.height;
      } break;

      case CLOSE: {
        stopLove();
      } break;
      }
    }
  }

  if (luaState) {
    if (!lovePaused) {
      stepLove();
    } else {
      Sleep(200);
    }

    {
      RECT currParentRect;
      auto parent = ghostWinGetMainWindow();
      if (parent) {
        GetWindowRect(parent, &currParentRect);
      }
      if (prevParentRect.right != prevParentRect.left) {
        auto dw = (currParentRect.right - currParentRect.left) -
                  (prevParentRect.right - prevParentRect.left);
        auto dy = (currParentRect.bottom - currParentRect.top) -
                  (prevParentRect.bottom - prevParentRect.top);
        childWidth += dw;
        childHeight += dy;
      }

      prevParentRect = currParentRect;
    }

    auto child = ghostWinGetChildWindow();
    if (child) {
      SetWindowPos(child, NULL, childLeft, childTop, childWidth, childHeight, 0);
    }

    // Handle automatic pausing when unfocused
    if (child) {
      auto foregroundWindow = GetForegroundWindow();
      auto focused = foregroundWindow == ghostWinGetMainWindow() || foregroundWindow == child;
      if (lovePaused && focused) { // Unpause?
        // Step timer so that next frame's `dt` doesn't include the time spent paused
        auto timer = love::Module::getInstance<love::timer::Timer>(love::Module::M_TIMER);
        if (timer) {
          timer->step();
        }
        lovePaused = false;
      }
      if (!lovePaused && !focused) { // Pause?
        lovePaused = true;
      }
    }

    auto channel = love::thread::Channel::getChannel("FOCUS_ME");
    if (channel->getCount() > 0) {
      channel->clear();
      auto parent = ghostWinGetMainWindow();
      if (parent && GetForegroundWindow() == parent) {
        SetFocus(child);
      }
    }
  } else {
    // If not running Love, sleep for longer per loop
    Sleep(100);
  }
}

void ghostRunMessageLoop() {
  while (shouldRunMessageLoop) {
    ghostStep();
  }

  stopLove();
}
