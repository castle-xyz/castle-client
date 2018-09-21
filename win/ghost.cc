#include "ghost.h"

#include <windows.h>

#include <mutex>
#include <queue>

// win implementation of 'ghost.h'
extern "C" {
#include <lauxlib.h>
#include <lua.h>
#include <lualib.h>
}

#include "modules/love/love.h"

static float childLeft = 0, childTop = 0, childWidth = 200, childHeight = 200;

static lua_State *luaState = NULL;
static int loveBootStackPos = 0;

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
  // TODO
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

extern "C" {
void ghostStep();
}

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

    // TODO(nikki/jesse): Somehow refer to 'base/' stuff in here
    // NSArray *bundlepaths =
    //    [[NSBundle mainBundle] pathsForResourcesOfType:@"love" inDirectory:nil];
    // if (bundlepaths.count > 0) {
    //  lua_pushstring(L, [bundlepaths[0] UTF8String]);
    //  lua_rawseti(L, -2, 0);
    //  lua_pushstring(L, "--fused");
    //  lua_rawseti(L, -2, 1);
    //}
    lua_pushstring(L, "C:\\Users\\nikki-desktop-win\\Development\\ghost\\base");
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

void ghostStep() {
  // Process messages
  {
    std::lock_guard<std::mutex> guard(mutex);
    while (messages.size() > 0) {
      Message &msg = messages.front();

      switch (msg.type) {
      case OPEN_LOVE_URI: {
        char *uri = msg.body.openUri.uri;
        closeLua();
        bootLove(uri);
        free(uri);
      } break;

      case CLOSE: {
        closeLua();
      } break;
      }

      messages.pop();
    }
  }

  if (luaState) {
    stepLove();
  } else {
	// If not running Love, sleep for longer per loop
    Sleep(100);
  }
}
