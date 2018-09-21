// Copyright (c) 2013 The Chromium Embedded Framework Authors. All rights
// reserved. Use of this source code is governed by a BSD-style license that
// can be found in the LICENSE file.

#include "simple_handler.h"

#include <string>
#include <windows.h>

#include "include/cef_browser.h"

extern "C" {
void ghostWinSetMainWindow(HWND window);
}

void SimpleHandler::PlatformTitleChange(CefRefPtr<CefBrowser> browser, const CefString &title) {
  CefWindowHandle hwnd = browser->GetHost()->GetWindowHandle();
  ghostWinSetMainWindow(hwnd);
  SetWindowText(hwnd, std::wstring(title).c_str());
}
