// Copyright (c) 2013 The Chromium Embedded Framework Authors. All rights
// reserved. Use of this source code is governed by a BSD-style license that
// can be found in the LICENSE file.

#include "simple_app.h"

#include "ghost_constants.h"
#include "include/cef_browser.h"
#include "include/cef_command_line.h"
#include "include/cef_origin_whitelist.h"
#include "include/views/cef_browser_view.h"
#include "include/views/cef_window.h"
#include "include/wrapper/cef_helpers.h"
#include "simple_handler.h"

namespace {

// When using the Views framework this object provides the delegate
// implementation for the CefWindow that hosts the Views-based browser.
class SimpleWindowDelegate : public CefWindowDelegate {
public:
  explicit SimpleWindowDelegate(CefRefPtr<CefBrowserView> browser_view)
      : browser_view_(browser_view) {}

  void OnWindowCreated(CefRefPtr<CefWindow> window) OVERRIDE {
    // Add the browser view and show the window.
    window->AddChildView(browser_view_);
    window->Show();

    // Give keyboard focus to the browser view.
    browser_view_->RequestFocus();
  }

  void OnWindowDestroyed(CefRefPtr<CefWindow> window) OVERRIDE { browser_view_ = NULL; }

  bool CanClose(CefRefPtr<CefWindow> window) OVERRIDE {
    // Allow the window to close if the browser says it's OK.
    CefRefPtr<CefBrowser> browser = browser_view_->GetBrowser();
    if (browser)
      return browser->GetHost()->TryCloseBrowser();
    return true;
  }

private:
  CefRefPtr<CefBrowserView> browser_view_;

  IMPLEMENT_REFCOUNTING(SimpleWindowDelegate);
  DISALLOW_COPY_AND_ASSIGN(SimpleWindowDelegate);
};

} // namespace

SimpleApp::SimpleApp(std::string initialUrl, int initialWindowWidth, int initialWindowHeight) {
  this->_initialUrl = initialUrl;
  this->_initialWindowWidth = initialWindowWidth;
  this->_initialWindowHeight = initialWindowHeight;
}

void SimpleApp::OnRegisterCustomSchemes(CefRawPtr<CefSchemeRegistrar> registrar) {
  registrar->AddCustomScheme(kGhostUrlScheme, true, false, false, false, false, false);
}

void SimpleApp::OnBeforeCommandLineProcessing(const CefString& process_type, CefRefPtr<CefCommandLine> command_line) {
  command_line->AppendSwitch("enable-media-stream");
}

void SimpleApp::OnContextInitialized() {
  CEF_REQUIRE_UI_THREAD();

  CefRefPtr<CefCommandLine> command_line = CefCommandLine::GetGlobalCommandLine();

#if defined(OS_WIN) || defined(OS_LINUX)
  // Create the browser using the Views framework if "--use-views" is specified
  // via the command-line. Otherwise, create the browser using the native
  // platform framework. The Views framework is currently only supported on
  // Windows and Linux.
  const bool use_views = command_line->HasSwitch("use-views");
#else
  const bool use_views = false;
#endif

  // SimpleHandler implements browser-level callbacks.
  CefRefPtr<SimpleHandler> handler(new SimpleHandler(use_views));

  // Specify CEF browser settings here.
  CefBrowserSettings browser_settings;
  browser_settings.universal_access_from_file_urls = STATE_ENABLED;
  browser_settings.file_access_from_file_urls = STATE_ENABLED;

  // Make it so we disable web security for http(s) and castle(s) requests on the initial URL
  // This will let us do arbitrary `fetch` requests, etc.
  CefAddCrossOriginWhitelistEntry(this->_initialUrl, "http", "", true);
  CefAddCrossOriginWhitelistEntry(this->_initialUrl, "castle", "", true);
  CefAddCrossOriginWhitelistEntry(this->_initialUrl, "https", "", true);
  CefAddCrossOriginWhitelistEntry(this->_initialUrl, "castles", "", true);

  std::string url;

  // Check if a "--url=" value was provided via the command-line. If so, use
  // that instead of the default URL.
  url = command_line->GetSwitchValue("url");
  if (url.empty()) {
    url = this->_initialUrl;
  }

  if (use_views) {
    // Create the BrowserView.
    CefRefPtr<CefBrowserView> browser_view =
        CefBrowserView::CreateBrowserView(handler, url, browser_settings, NULL, NULL);

    // Create the Window. It will show itself after creation.
    CefWindow::CreateTopLevelWindow(new SimpleWindowDelegate(browser_view));
  } else {
    // Information used when creating the native window.
    CefWindowInfo window_info;
    if (this->_initialWindowWidth) {
      window_info.width = this->_initialWindowWidth;
    }
    if (this->_initialWindowHeight) {
      window_info.height = this->_initialWindowHeight;
    }

#if defined(OS_WIN)
    // On Windows we need to specify certain flags that will be passed to
    // CreateWindowEx().
    window_info.SetAsPopup(NULL, "Castle");
#endif

    // Create the first browser window.
    CefBrowserHost::CreateBrowser(window_info, handler, url, browser_settings, NULL);
  }
}
