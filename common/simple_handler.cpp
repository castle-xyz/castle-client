// Copyright (c) 2013 The Chromium Embedded Framework Authors. All rights
// reserved. Use of this source code is governed by a BSD-style license that
// can be found in the LICENSE file.

#include "simple_handler.h"

#include <sstream>
#include <string>

#include "include/base/cef_bind.h"
#include "include/cef_app.h"
#include "include/views/cef_browser_view.h"
#include "include/views/cef_window.h"
#include "include/wrapper/cef_closure_task.h"
#include "include/wrapper/cef_helpers.h"

#include "modules/thread/Channel.h"

#include "json.hpp"
using nlohmann::json;

#include "ghost.h"
#include "ghost_constants.h"

namespace {

SimpleHandler *g_instance = NULL;

} // namespace

SimpleHandler::SimpleHandler(bool use_views)
    : use_views_(use_views), is_closing_(false), conversion_lua_state_(luaL_newstate()) {
  DCHECK(!g_instance);
  g_instance = this;
}

SimpleHandler::~SimpleHandler() {
  g_instance = NULL;
  lua_close(conversion_lua_state_);
}

// static
SimpleHandler *SimpleHandler::GetInstance() { return g_instance; }

void SimpleHandler::OnTitleChange(CefRefPtr<CefBrowser> browser, const CefString &title) {
  CEF_REQUIRE_UI_THREAD();

  if (use_views_) {
    // Set the title of the window using the Views framework.
    CefRefPtr<CefBrowserView> browser_view = CefBrowserView::GetForBrowser(browser);
    if (browser_view) {
      CefRefPtr<CefWindow> window = browser_view->GetWindow();
      if (window)
        window->SetTitle(title);
    }
  } else {
    // Set the title of the window using platform APIs.
    PlatformTitleChange(browser, title);
  }
}

bool SimpleHandler::OnProcessMessageReceived(CefRefPtr<CefBrowser> browser,
                                             CefProcessId source_process,
                                             CefRefPtr<CefProcessMessage> message) {
  CEF_REQUIRE_UI_THREAD();
  return message_router_->OnProcessMessageReceived(browser, source_process, message);
}

void SimpleHandler::OnAfterCreated(CefRefPtr<CefBrowser> browser) {
  CEF_REQUIRE_UI_THREAD();

  // Add to the list of existing browsers.
  browser_list_.push_back(browser);

  class MessageHandler : public CefMessageRouterBrowserSide::Handler {
  public:
    MessageHandler(lua_State *conversion_lua_state) : conversion_lua_state_(conversion_lua_state) {}

    // Called due to cefQuery execution in message_router.html.
    bool OnQuery(CefRefPtr<CefBrowser> browser, CefRefPtr<CefFrame> frame, int64 query_id,
                 const CefString &request, bool persistent, CefRefPtr<Callback> callback) OVERRIDE {
      const std::string &strRequest = request;
      auto parsed = json::parse(strRequest);

      std::string type = parsed["type"];
      auto body = parsed["body"];
      if (type == "OPEN_URI") {
        std::string uri = body["uri"];
        ghostOpenLoveUri(uri.c_str());

        callback->Success("success");
        return true;
      } else if (type == "CLOSE") {
        ghostClose();

        callback->Success("success");
        return true;
      } else if (type == "SET_CHILD_WINDOW_FRAME") {
        float left = body["left"];
        float top = body["top"];
        float width = body["width"];
        float height = body["height"];

        ghostSetChildWindowFrame(left, top, width, height);

        callback->Success("success");
        return true;
      } else if (type == "READ_CHANNELS") {
        auto response = json::object();

        for (const std::string &channelName : body["channelNames"]) {
          response[channelName] = json::array();
          auto channel = love::thread::Channel::getChannel(channelName);
          love::Variant var;
          while (channel->pop(&var)) {
            assert(var.getType() == love::Variant::STRING ||
                   var.getType() == love::Variant::SMALLSTRING);
            var.toLua(conversion_lua_state_);
            response[channelName].push_back(luaL_checkstring(conversion_lua_state_, -1));
          }
        }

        callback->Success(response.dump());
        return true;
      } else if (type == "BROWSER_READY") {
        ghostSetBrowserReady();
        callback->Success("success");
        return true;
      }

      return false;
    }

  private:
    lua_State *conversion_lua_state_;
    DISALLOW_COPY_AND_ASSIGN(MessageHandler);
  };

  if (!message_router_) {
    CefMessageRouterConfig config;
    message_router_ = CefMessageRouterBrowserSide::Create(config);

    message_handler_.reset(new MessageHandler(conversion_lua_state_));
    message_router_->AddHandler(message_handler_.get(), false);
  }
}

bool SimpleHandler::DoClose(CefRefPtr<CefBrowser> browser) {
  CEF_REQUIRE_UI_THREAD();

  // Closing the main window requires special handling. See the DoClose()
  // documentation in the CEF header for a detailed destription of this
  // process.
  if (browser_list_.size() == 1) {
    // Set a flag to indicate that the window close should be allowed.
    is_closing_ = true;
  }

  ghostQuitMessageLoop();

  // Allow the close. For windowed browsers this will result in the OS close
  // event being sent.
  return false;
}

void SimpleHandler::OnBeforeClose(CefRefPtr<CefBrowser> browser) {
  CEF_REQUIRE_UI_THREAD();

  // Remove from the list of existing browsers.
  BrowserList::iterator bit = browser_list_.begin();
  for (; bit != browser_list_.end(); ++bit) {
    if ((*bit)->IsSame(browser)) {
      browser_list_.erase(bit);
      break;
    }
  }

  if (browser_list_.empty()) {
    // All browser windows have closed. Quit the application message loop.
    ghostQuitMessageLoop();

    // On Windows CEF automatically handles the message loop on another thread. On macOS it's on the
    // same thread and we need to quit manually.
#ifdef __APPLE__
    CefQuitMessageLoop();
#endif

    message_router_->OnBeforeClose(browser);
    message_router_->RemoveHandler(message_handler_.get());
    message_handler_.reset();
    message_router_ = NULL;
  }
}

void SimpleHandler::OnLoadEnd(CefRefPtr<CefBrowser> browser, CefRefPtr<CefFrame> frame,
                              int httpStatusCode) {
  auto url = std::string(frame->GetURL());
  std::stringstream params;
  params << "{"
         << " url: \"" << url << "\", "
         << "}";
  ghostSendJSEvent(kGhostLoadEndEventName.c_str(), params.str().c_str());
}

void SimpleHandler::OnLoadError(CefRefPtr<CefBrowser> browser, CefRefPtr<CefFrame> frame,
                                ErrorCode errorCode, const CefString &errorText,
                                const CefString &failedUrl) {
  CEF_REQUIRE_UI_THREAD();

  // Don't display an error for downloaded files.
  if (errorCode == ERR_ABORTED)
    return;

  std::stringstream params;
  params << "{"
         << " url: \"" << std::string(failedUrl) << "\", "
         << " errorText: \"" << std::string(errorText) << "\", "
         << " errorCode: " << errorCode << ", "
         << "}";
  ghostSendJSEvent(kGhostLoadErrorEventName.c_str(), params.str().c_str());

  // Display a load error message.
  std::stringstream ss;
  ss << "<html><body bgcolor=\"white\">"
        "<h2>Failed to load URL "
     << std::string(failedUrl) << " with error " << std::string(errorText) << " (" << errorCode
     << ").</h2></body></html>";
  frame->LoadString(ss.str(), failedUrl);
}

void SimpleHandler::CloseAllBrowsers(bool force_close) {
  if (!CefCurrentlyOn(TID_UI)) {
    // Execute on the UI thread.
    CefPostTask(TID_UI, base::Bind(&SimpleHandler::CloseAllBrowsers, this, force_close));
    return;
  }

  if (browser_list_.empty())
    return;

  BrowserList::const_iterator it = browser_list_.begin();
  for (; it != browser_list_.end(); ++it)
    (*it)->GetHost()->CloseBrowser(force_close);
}

bool SimpleHandler::OnBeforeBrowse(CefRefPtr<CefBrowser> browser, CefRefPtr<CefFrame> frame,
                                   CefRefPtr<CefRequest> request, bool user_gesture,
                                   bool is_redirect) {
  CEF_REQUIRE_UI_THREAD();

  message_router_->OnBeforeBrowse(browser, frame);
  auto url = std::string(request->GetURL());
  if (url.compare(0, kGhostUrlScheme.length(), kGhostUrlScheme) == 0) {
    ghostHandleOpenUri(url.c_str());

    // don't allow the browser to handle these.
    return true;
  }
  return false;
}

bool SimpleHandler::OnDragEnter(CefRefPtr<CefBrowser> browser, CefRefPtr<CefDragData> dragData,
                                DragOperationsMask mask) {
  // prevents CEF from auto-opening random txt or image files that are dragged into the window.
  // see: https://code.google.com/archive/p/chromiumembedded/issues/644
  return true;
}

void SimpleHandler::OnRenderProcessTerminated(CefRefPtr<CefBrowser> browser,
                                              TerminationStatus status) {
  CEF_REQUIRE_UI_THREAD();

  message_router_->OnRenderProcessTerminated(browser);
}

CefRefPtr<CefBrowser> SimpleHandler::GetFirstBrowser() {
  if (browser_list_.empty()) {
    return NULL;
  }
  return browser_list_.front();
}
