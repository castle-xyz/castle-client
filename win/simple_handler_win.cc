// Copyright (c) 2013 The Chromium Embedded Framework Authors. All rights
// reserved. Use of this source code is governed by a BSD-style license that
// can be found in the LICENSE file.

#include "ghost.h"
#include "ghost_constants.h"
#include "simple_handler.h"

#include <CommCtrl.h>
#include <string>
#include <windows.h>

#include "include/cef_browser.h"

#define ICON_ID 1

#define FILE_MENU_OPEN 1

extern "C" {
void ghostWinSetMainWindow(HWND window);
}

static void addMenus(HWND hwnd) {
  HMENU hMenubar;
  HMENU hMenu;

  hMenubar = CreateMenu();
  hMenu = CreateMenu();

  AppendMenu(hMenu, MF_STRING, FILE_MENU_OPEN, L"&Open Project...");

  AppendMenu(hMenubar, MF_POPUP, (UINT_PTR)hMenu, L"&File");
  SetMenu(hwnd, hMenubar);
}

LRESULT CALLBACK GhostSubclassProc(HWND hwnd, UINT msg, WPARAM w_param, LPARAM l_param,
                                   UINT_PTR subclass_id, DWORD_PTR ref_data) {
  switch (msg) {
  case WM_COMMAND:
    // WM_COMMAND is sent when the user clicks on a menu
    switch (LOWORD(w_param)) {
    case FILE_MENU_OPEN:
      std::stringstream params;
      params << "{ action: \"" << kGhostMenuFileOpenAction << "\" }";
      ghostSendJSEvent(kGhostNativeMenuSelectedEventName, params.str().c_str());
      break;
    }
    break;
  }
  UNREFERENCED_PARAMETER(ref_data);
  return DefSubclassProc(hwnd, msg, w_param, l_param);
}

static bool checkingForUpdates = false;

static HANDLE updateCheckStdOutRead;
static HANDLE updateCheckStdOutWrite;

// static VOID NTAPI checkForUpdatesProcessFinished(PVOID lpParameter, BOOLEAN timerOrWaitFired) {
//   // checkingForUpdates = false;
//   // UnregisterWait(updateCheckWaitObject);

//   // Read `stdout`
// }

static VOID CALLBACK checkForUpdates(HWND hwnd, UINT uMsg, UINT_PTR timerId, DWORD dwTime) {
  // Only run at most one check simultaneously
  if (checkingForUpdates) {
    return;
  }
  checkingForUpdates = true;

  printf("hello, wornd\n");

  // Full path to Squirrel's 'Update.exe' (one directory up)
  wchar_t updateCmd[MAX_PATH + 256];
  GetModuleFileName(NULL, updateCmd, MAX_PATH);
  *wcsrchr(updateCmd, L'\\') = L'\0';
  wcscpy(wcsrchr(updateCmd, L'\\'), L"\\Update.exe");

  // Add the `--checkForUpdates` command
  // wcscat(updateCmd, L" --checkForUpdate "
  //                   L"https://raw.githubusercontent.com/castle-games/castle-releases/win2/win");
  wcscat(updateCmd, L" --update "
                    L"C:\\Users\\nikki\\Development\\ghost\\megasource\\castle-releases\\win");

  // Create a pipe to capture `stdout` of the child process
  // See:
  // https://docs.microsoft.com/en-us/windows/desktop/ProcThread/creating-a-child-process-with-redirected-input-and-output
  SECURITY_ATTRIBUTES sAttr;
  sAttr.nLength = sizeof(sAttr);
  sAttr.bInheritHandle = TRUE;
  sAttr.lpSecurityDescriptor = NULL;
  if (!CreatePipe(&updateCheckStdOutRead, &updateCheckStdOutWrite, &sAttr, 0)) {
    checkingForUpdates = false;
    return;
  }
  if (!SetHandleInformation(updateCheckStdOutRead, HANDLE_FLAG_INHERIT, 0)) {
    checkingForUpdates = false;
    return;
  }

  // Call `CreateProcessW` and wait for it
  PROCESS_INFORMATION pInfo;
  STARTUPINFO sInfo;
  memset(&sInfo, 0, sizeof(sInfo));
  memset(&pInfo, 0, sizeof(pInfo));
  sInfo.cb = sizeof(sInfo);
  sInfo.hStdOutput = updateCheckStdOutWrite;
  sInfo.dwFlags |= STARTF_USESTDHANDLES;
  if (!CreateProcessW(nullptr, updateCmd, nullptr, nullptr, 0, 0, nullptr, nullptr, &sInfo,
                      &pInfo)) {
    checkingForUpdates = false;
    return;
  }
  WaitForSingleObject(pInfo.hProcess, INFINITE);

  // Clean up the process
  DWORD exitCode;
  GetExitCodeProcess(pInfo.hProcess, &exitCode);
  CloseHandle(pInfo.hProcess);
  CloseHandle(pInfo.hThread);

  // Read `stdout`
  CloseHandle(updateCheckStdOutWrite);
  char buf[520];
  DWORD bufLength;
  ReadFile(updateCheckStdOutRead, buf, 512, &bufLength, NULL);
  buf[bufLength] = '\0';
  MessageBoxA(NULL, buf, "Read!", MB_OK);
  CloseHandle(updateCheckStdOutRead);
}

void SimpleHandler::PlatformTitleChange(CefRefPtr<CefBrowser> browser, const CefString &title) {
  CefWindowHandle hwnd = browser->GetHost()->GetWindowHandle();
  ghostWinSetMainWindow(hwnd);
  SetWindowText(hwnd, std::wstring(title).c_str());

  HINSTANCE hInstance = (HINSTANCE)GetWindowLong(hwnd, GWL_HINSTANCE);
  HICON hIcon = LoadIcon(hInstance, MAKEINTRESOURCE(ICON_ID));
  SendMessage(hwnd, WM_SETICON, ICON_SMALL, (LPARAM)hIcon);
  SendMessage(hwnd, WM_SETICON, ICON_BIG, (LPARAM)hIcon);

  // SetTimer(hwnd, 0, 10 * 1000, &checkForUpdates);
  checkForUpdates(0, 0, 0, 0);
}

void SimpleHandler::SubclassWndProc(CefWindowHandle hwnd) {
  SetWindowSubclass(hwnd, GhostSubclassProc, 1, reinterpret_cast<DWORD_PTR>(this));
  addMenus(hwnd);
}