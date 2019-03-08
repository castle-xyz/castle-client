// Copyright (c) 2013 The Chromium Embedded Framework Authors. All rights
// reserved. Use of this source code is governed by a BSD-style license that
// can be found in the LICENSE file.

#include "ghost.h"
#include "ghost_constants.h"
#include "simple_handler.h"

#include <CommCtrl.h>
#include <string>
#include <windows.h>

#include "dirent.h"
#include <fstream>
#include <regex>
#include <sstream>

#include "include/cef_browser.h"

#define ICON_ID 1

#define FILE_MENU_OPEN 1

static HWND mainWindow;

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

static auto updateCheckInProgress = false;
static HANDLE updateCheckWait;
static PROCESS_INFORMATION updateCheckProcessInfo;
const UINT_PTR updateCheckTimerId = 2000;

static VOID NTAPI finishUpdateCheck(PVOID lpParameter, BOOLEAN timerOrWaitFired) {
  updateCheckInProgress = false;

  // Clean up the process
  UnregisterWait(updateCheckWait);
  DWORD exitCode;
  GetExitCodeProcess(updateCheckProcessInfo.hProcess, &exitCode);
  CloseHandle(updateCheckProcessInfo.hProcess);
  CloseHandle(updateCheckProcessInfo.hThread);

  // Full path to Squirrel's 'packages' directory ('../packages')
  wchar_t packagesDir[MAX_PATH + 256];
  GetModuleFileName(NULL, packagesDir, MAX_PATH);
  *wcsrchr(packagesDir, L'\\') = L'\0';
  wcscpy(wcsrchr(packagesDir, L'\\'), L"\\packages\\");

  // Regex to extract actual version name
  const std::regex versionRegex("Castle-0\\.1\\.([0-9]+).*");

  // Find current version
  int currentVersion;
  {
    std::ifstream readReleases(std::wstring(packagesDir) + L"RELEASES");
    std::string currentPkg;
    readReleases >> currentPkg;
    readReleases >> currentPkg;
    std::smatch regexMatches;
    if (!std::regex_match(currentPkg, regexMatches, versionRegex)) {
      updateCheckInProgress = false;
      return;
    }
    std::stringstream ss(regexMatches[1].str());
    ss >> currentVersion;
  }

  // Enumerate '../packages' contents and see if any higher version number exists
  int maxVersion = 0;
  auto foundHigherVersion = false;
  auto dir = _wopendir(packagesDir);
  _wdirent *de;
  while ((de = _wreaddir(dir)) != NULL) {
    std::string filename;
    std::wstring wfilename(de->d_name);
    filename.assign(wfilename.begin(), wfilename.end());
    std::smatch regexMatches;
    int version;
    if (std::regex_match(filename, regexMatches, versionRegex)) {
      std::stringstream ss(regexMatches[1].str());
      ss >> version;
      if (version > currentVersion) {
        foundHigherVersion = true;
        if (version > maxVersion) {
          maxVersion = version;
        }
      }
    }
  }

  // Do thing!
  if (foundHigherVersion) {
    std::stringstream params;
    params << "{"
           << " versionString: \"1." << maxVersion << "\", "
           << " dateString: \"\", "
           << "}";
    ghostSendJSEvent(kGhostUpdateAvailableEventName, params.str().c_str());
  }
}

static VOID CALLBACK beginUpdateCheck(HWND hwnd, UINT uMsg, UINT_PTR timerId, DWORD dwTime) {
  // Schedule this for every hour after the first one
  static auto firstCheck = true;
  if (firstCheck) {
    firstCheck = false;
    SetTimer(hwnd, updateCheckTimerId, 5 * 1000, &beginUpdateCheck);
  }

  // Only run at most one check simultaneously
  if (updateCheckInProgress) {
    return;
  }
  updateCheckInProgress = true;

  // Full path to Squirrel's 'Update.exe' ('../Update.exe')
  wchar_t updateCmd[MAX_PATH + 256];
  GetModuleFileName(NULL, updateCmd, MAX_PATH);
  *wcsrchr(updateCmd, L'\\') = L'\0';
  wcscpy(wcsrchr(updateCmd, L'\\'), L"\\Update.exe");

  // Add the `--download` command
#define UPDATES_URL L"C:\\Users\\nikki\\Development\\ghost\\megasource\\castle-releases\\win"
  // #define UPDATES_URL L"https://raw.githubusercontent.com/castle-games/castle-releases/win2/win"
  wcscat(updateCmd, L" --download " UPDATES_URL);

  // Call `CreateProcessW` and wait for it
  STARTUPINFO sInfo;
  memset(&sInfo, 0, sizeof(sInfo));
  memset(&updateCheckProcessInfo, 0, sizeof(updateCheckProcessInfo));
  sInfo.cb = sizeof(sInfo);
  if (!CreateProcessW(nullptr, updateCmd, nullptr, nullptr, 0, 0, nullptr, nullptr, &sInfo,
                      &updateCheckProcessInfo)) {
    updateCheckInProgress = false;
    return;
  }
  RegisterWaitForSingleObject(&updateCheckWait, updateCheckProcessInfo.hProcess, &finishUpdateCheck,
                              0, 60 * 1000, WT_EXECUTEONLYONCE);
}

void SimpleHandler::PlatformTitleChange(CefRefPtr<CefBrowser> browser, const CefString &title) {
  CefWindowHandle hwnd = browser->GetHost()->GetWindowHandle();
  ghostWinSetMainWindow(hwnd);
  mainWindow = hwnd;
  SetWindowText(hwnd, std::wstring(title).c_str());

  HINSTANCE hInstance = (HINSTANCE)GetWindowLong(hwnd, GWL_HINSTANCE);
  HICON hIcon = LoadIcon(hInstance, MAKEINTRESOURCE(ICON_ID));
  SendMessage(hwnd, WM_SETICON, ICON_SMALL, (LPARAM)hIcon);
  SendMessage(hwnd, WM_SETICON, ICON_BIG, (LPARAM)hIcon);

  // Do first update check 5 seconds after boot, it sets itself for ever hour after the first one
  SetTimer(hwnd, updateCheckTimerId, 5 * 1000, &beginUpdateCheck);
}

void SimpleHandler::SubclassWndProc(CefWindowHandle hwnd) {
  SetWindowSubclass(hwnd, GhostSubclassProc, 1, reinterpret_cast<DWORD_PTR>(this));
  addMenus(hwnd);
}