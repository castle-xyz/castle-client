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

void ghostStep() {
  Sleep(16);
  {
    std::lock_guard<std::mutex> guard(mutex);
    while (messages.size() > 0) {
      Message &msg = messages.front();

      switch (msg.type) {
      case OPEN_LOVE_URI: {
        printf("open love uri: %s\n", msg.body.openUri.uri);
        free(msg.body.openUri.uri);
      } break;

      case CLOSE: {
        printf("close\n");
      } break;
      }

      messages.pop();
    }
  }
}
