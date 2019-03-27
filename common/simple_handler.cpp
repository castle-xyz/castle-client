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
#include "js_binds.h"

namespace {

SimpleHandler *g_instance = NULL;

} // namespace

SimpleHandler::SimpleHandler(bool use_views) : use_views_(use_views), is_closing_(false) {
  DCHECK(!g_instance);
  g_instance = this;
}

SimpleHandler::~SimpleHandler() { g_instance = NULL; }

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

void SimpleHandler::OnBeforeDownload(CefRefPtr<CefBrowser> browser,
                                     CefRefPtr<CefDownloadItem> download_item,
                                     const CefString &suggested_name,
                                     CefRefPtr<CefBeforeDownloadCallback> callback) {
  CefString requested_url = download_item->GetOriginalUrl();
  this->SendDownloadStartEvent(download_item->GetId(), requested_url.ToString());

  // can set the download_path param to something non-empty here if we don't want
  // to download the file to the default temp dir.
  callback->Continue(CefString(), false);
}

void SimpleHandler::OnDownloadUpdated(CefRefPtr<CefBrowser> browser,
                                      CefRefPtr<CefDownloadItem> download_item,
                                      CefRefPtr<CefDownloadItemCallback> callback) {
  uint32 download_id = download_item->GetId();
  if (download_item->IsCanceled()) {
    // download was canceled or interrupted
    this->SendDownloadFinishEvent(download_id, "");
  } else {
    // did the user ask the download to cancel?
    std::map<uint32, bool>::iterator it = download_cancelled_.find(download_id);
    if (it != download_cancelled_.end() && download_cancelled_[download_id] == true) {
      callback->Cancel();
      download_cancelled_.erase(it);
      this->SendDownloadFinishEvent(download_id, "");
    } else {
      // download is running or finished
      time_t end_time = download_item->GetEndTime().GetTimeT();
      if (end_time) {
        CefString download_path = download_item->GetFullPath();
        this->SendDownloadFinishEvent(download_id, download_path.ToString());
      } else {
        // percent_complete is 0-100, or -1 if CEF doesn't have any useful info
        int percent_complete = download_item->GetPercentComplete();
        if (percent_complete >= 0) {
          this->SendDownloadProgressEvent(download_item->GetId(), percent_complete);
        }
      }
    }
  }
}

bool SimpleHandler::SetDownloadCanceled(uint32 download_id) {
  download_cancelled_[download_id] = true;
  return true;
}

bool SimpleHandler::OnProcessMessageReceived(CefRefPtr<CefBrowser> browser,
                                             CefProcessId source_process,
                                             CefRefPtr<CefProcessMessage> message) {
  CEF_REQUIRE_UI_THREAD();
  return message_router_->OnProcessMessageReceived(browser, source_process, message);
}

void SimpleHandler::OnAfterCreated(CefRefPtr<CefBrowser> browser) {
  CEF_REQUIRE_UI_THREAD();

#if defined(OS_WIN)
  SubclassWndProc(browser->GetHost()->GetWindowHandle());
#endif

  // Add to the list of existing browsers.
  browser_list_.push_back(browser);

  class MessageHandler : public CefMessageRouterBrowserSide::Handler {
  public:
    MessageHandler() {}

    // Called due to cefQuery execution in message_router.html.
    bool OnQuery(CefRefPtr<CefBrowser> browser, CefRefPtr<CefFrame> frame, int64 query_id,
                 const CefString &request, bool persistent, CefRefPtr<Callback> callback) OVERRIDE {
      const std::string &strRequest = request;
      auto parsed = json::parse(strRequest);
      std::string name = parsed["name"];
      JSBinds::Function func = JSBinds::find(name.c_str());
      if (func) {
        auto arg = parsed["arg"];
        func(arg, [=](const std::string &response) { callback->Success(response); },
             [=](const std::string &message) { callback->Failure(0, message); });
        return true;
      } else {
        callback->Failure(0, "no JS binding named '" + name + "'");
        return true;
      }
    }

  private:
    DISALLOW_COPY_AND_ASSIGN(MessageHandler);
  };

  if (!message_router_) {
    CefMessageRouterConfig config;
    message_router_ = CefMessageRouterBrowserSide::Create(config);

    message_handler_.reset(new MessageHandler());
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
  ghostSendJSEvent(kGhostLoadEndEventName, params.str().c_str());
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
  ghostSendJSEvent(kGhostLoadErrorEventName, params.str().c_str());

  // Display a load error message.
  std::stringstream ss;
  ss << "<html><body bgcolor=\"black\">"
        "<p style=\"color:#c63018; margin:12px\">There was a problem opening that url ("
     << std::string(errorText) << ").</p></body></html>";
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
  if (strncmp(url.c_str(), kGhostUrlScheme, strlen(kGhostUrlScheme)) == 0) {
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

void SimpleHandler::SendDownloadStartEvent(uint32 download_id, std::string requested_url) {
  std::stringstream params;
  params << "{"
         << " id: \"" << download_id << "\", "
         << " status: \"start\","
         << " url: \"" << requested_url << "\", "
         << "}";
  ghostSendJSEvent(kGhostFileDownloadEventName, params.str().c_str());
}

void SimpleHandler::SendDownloadProgressEvent(uint32 download_id, int progress) {
  std::stringstream params;
  params << "{"
         << " id: \"" << download_id << "\", "
         << " status: \"progress\","
         << " progress: \"" << progress << "\", "
         << "}";
  ghostSendJSEvent(kGhostFileDownloadEventName, params.str().c_str());
}

void SimpleHandler::SendDownloadFinishEvent(uint32 download_id, std::string path) {
  std::stringstream params;
  params << "{"
         << " id: \"" << download_id << "\", "
         << " status: \"finish\","
         << " path: \"" << path << "\", "
         << "}";
  ghostSendJSEvent(kGhostFileDownloadEventName, params.str().c_str());
}
