// Copyright (c) 2013 The Chromium Embedded Framework Authors. All rights
// reserved. Use of this source code is governed by a BSD-style license that
// can be found in the LICENSE file.

#ifndef CEF_TESTS_CEFSIMPLE_SIMPLE_HANDLER_H_
#define CEF_TESTS_CEFSIMPLE_SIMPLE_HANDLER_H_

#include "include/cef_client.h"
#include "include/wrapper/cef_message_router.h"

#include <list>

extern "C" {
#include <lauxlib.h>
#include <lua.h>
#include <lualib.h>
}

class SimpleHandler : public CefClient,
                      public CefDisplayHandler,
                      public CefDownloadHandler,
                      public CefLifeSpanHandler,
                      public CefLoadHandler,
                      public CefDragHandler,
                      public CefRequestHandler {
public:
  explicit SimpleHandler(bool use_views);
  ~SimpleHandler();

  // Provide access to the single global instance of this object.
  static SimpleHandler *GetInstance();

  // CefClient methods:
  virtual CefRefPtr<CefDisplayHandler> GetDisplayHandler() OVERRIDE { return this; }
  virtual CefRefPtr<CefDownloadHandler> GetDownloadHandler() OVERRIDE { return this; }
  virtual CefRefPtr<CefLifeSpanHandler> GetLifeSpanHandler() OVERRIDE { return this; }
  virtual CefRefPtr<CefLoadHandler> GetLoadHandler() OVERRIDE { return this; }
  virtual CefRefPtr<CefRequestHandler> GetRequestHandler() OVERRIDE { return this; }
  virtual CefRefPtr<CefDragHandler> GetDragHandler() OVERRIDE { return this; }
  bool OnProcessMessageReceived(CefRefPtr<CefBrowser> browser, CefProcessId source_process,
                                CefRefPtr<CefProcessMessage> message) OVERRIDE;

  // CefDisplayHandler methods:
  virtual void OnTitleChange(CefRefPtr<CefBrowser> browser, const CefString &title) OVERRIDE;

  // CefDownloadHandler methods:
  virtual void OnBeforeDownload(CefRefPtr<CefBrowser> browser,
                                CefRefPtr<CefDownloadItem> download_item,
                                const CefString &suggested_name,
                                CefRefPtr<CefBeforeDownloadCallback> callback) OVERRIDE;

  virtual void OnDownloadUpdated(CefRefPtr<CefBrowser> browser,
                                 CefRefPtr<CefDownloadItem> download_item,
                                 CefRefPtr<CefDownloadItemCallback> callback) OVERRIDE;

  // CefLifeSpanHandler methods:
  virtual void OnAfterCreated(CefRefPtr<CefBrowser> browser) OVERRIDE;
  virtual bool DoClose(CefRefPtr<CefBrowser> browser) OVERRIDE;
  virtual void OnBeforeClose(CefRefPtr<CefBrowser> browser) OVERRIDE;

  // CefLoadHandler methods:
  virtual void OnLoadEnd(CefRefPtr<CefBrowser> browser, CefRefPtr<CefFrame> frame,
                         int httpStatusCode) OVERRIDE;
  virtual void OnLoadError(CefRefPtr<CefBrowser> browser, CefRefPtr<CefFrame> frame,
                           ErrorCode errorCode, const CefString &errorText,
                           const CefString &failedUrl) OVERRIDE;

  // CefRequestHandler methods:
  bool OnBeforeBrowse(CefRefPtr<CefBrowser> browser, CefRefPtr<CefFrame> frame,
                      CefRefPtr<CefRequest> request, bool user_gesture, bool is_redirect) OVERRIDE;
  void OnRenderProcessTerminated(CefRefPtr<CefBrowser> browser, TerminationStatus status) OVERRIDE;

  // CefDragHandler
  bool OnDragEnter(CefRefPtr<CefBrowser> browser, CefRefPtr<CefDragData> dragData,
                   DragOperationsMask mask) OVERRIDE;

  // Request that all existing browser windows close.
  void CloseAllBrowsers(bool force_close);

  bool IsClosing() const { return is_closing_; }

  CefRefPtr<CefBrowser> GetFirstBrowser();

private:
  // Platform-specific implementation.
  void PlatformTitleChange(CefRefPtr<CefBrowser> browser, const CefString &title);

#if defined(OS_WIN)
  void SubclassWndProc(CefWindowHandle hwnd);
#endif

#ifdef __APPLE__
  void OnProtocolExecution(CefRefPtr<CefBrowser> browser, const CefString &url,
                           bool &allow_os_execution);
#endif

  // True if the application is using the Views framework.
  const bool use_views_;

  // List of existing browser windows. Only accessed on the CEF UI thread.
  typedef std::list<CefRefPtr<CefBrowser>> BrowserList;
  BrowserList browser_list_;

  bool is_closing_;

  CefRefPtr<CefMessageRouterBrowserSide> message_router_;
  scoped_ptr<CefMessageRouterBrowserSide::Handler> message_handler_;

  // mapping from CefDownloadItem->GetId() to bool whether to cancel this download.
  std::map<uint32, bool> download_cancelled_;
  void SendDownloadStartEvent(uint32 download_id, std::string requested_url);
  void SendDownloadProgressEvent(uint32 download_id, int progress);
  void SendDownloadFinishEvent(uint32 download_id, std::string path);

  // Include the default reference counting implementation.
  IMPLEMENT_REFCOUNTING(SimpleHandler);
};

#endif // CEF_TESTS_CEFSIMPLE_SIMPLE_HANDLER_H_
