#include "ghost.h"
#include "simple_handler.h"

#include <fstream>
#include <iostream>

const std::string kDefaultStarterTemplateCode =
    "function love.draw()\n    love.graphics.print('Edit main.lua to get started!', 400, 300)\n    "
    "love.graphics.print('Press Cmd/Ctrl + R to reload.', 400, 316)\nend";

GHOST_EXPORT void ghostSendJSEvent(const char *eventName, const char *serializedParams) {
  std::string validatedParams = (serializedParams) ? serializedParams : "{}";
  std::stringstream msg;
  msg << "{ let event = new Event('" << eventName << "'); "
      << "event.params = " << validatedParams << "; "
      << "window.dispatchEvent(event); }";

  CefRefPtr<CefBrowser> browser = SimpleHandler::GetInstance()->GetFirstBrowser();
  CefRefPtr<CefFrame> frame = browser->GetMainFrame();
  frame->ExecuteJavaScript(msg.str(), frame->GetURL(), 0);
}

void ghostDownloadFile(const char *fromUrl) {
  CefRefPtr<CefBrowser> browser = SimpleHandler::GetInstance()->GetFirstBrowser();
  browser->GetHost()->StartDownload(CefString(fromUrl));
}

bool ghostCancelDownload(unsigned int downloadId) {
  return SimpleHandler::GetInstance()->SetDownloadCanceled(downloadId);
}

inline bool fileExists(const char *path) {
  if (FILE *file = fopen(path, "r")) {
    fclose(file);
    return true;
  }
  return false;
}

bool _ghostCreateFileFromTemplateAtPath(const char *path, const char *filenameToRead,
                                        const char *filenameToWrite, const char **filePathCreated) {
  // read bundled file
  const char *pathToBundledFile;
  std::string fileContents;
  bool success = ghostGetPathToFileInAppBundle(filenameToRead, &pathToBundledFile);
  if (success) {
    std::ifstream fileContentsStream(pathToBundledFile);
    fileContents = std::string((std::istreambuf_iterator<char>(fileContentsStream)),
                               std::istreambuf_iterator<char>());
    std::free((void *)pathToBundledFile);
  }

  // construct path to output file
  std::string outputFilePath(path);
  std::stringstream outputFilePathStream;
  outputFilePathStream << outputFilePath;

#if defined(WIN32) || defined(_WIN32)
  if (outputFilePath.back() != '\\') {
    outputFilePathStream << "\\";
  }
#else
  if (outputFilePath.back() != '/') {
    outputFilePathStream << "/";
  }
#endif
  outputFilePathStream << filenameToWrite;
  outputFilePath = outputFilePathStream.str();

  // don't overwrite existing file
  if (fileExists(outputFilePath.c_str())) {
    return false;
  }

  // write output file
  std::ofstream outfile(outputFilePath);
  outfile << fileContents << std::endl;
  outfile.close();

  // check that we actually created the file
  bool didCreate = fileExists(outputFilePath.c_str());
  if (didCreate) {
    *filePathCreated = strdup(outputFilePath.c_str());
    return true;
  }
  return false;
}

bool ghostCreateProjectAtPath(const char *path, const char **entryPoint) {
  const char *mainFileCreated;
  bool result = _ghostCreateFileFromTemplateAtPath(path, "blank.lua", "main.lua", &mainFileCreated);
  if (!result) {
    return false;
  }
  std::free((void *)mainFileCreated);
  return _ghostCreateFileFromTemplateAtPath(path, "blank.castle", "project.castle", entryPoint);
}

std::string ghostStartNodeProcess() {
  const char *pathToBundledFile;

#ifdef _MSC_VER
  bool success = ghostGetPathToFileInAppBundle("castle-desktop-node-win.exe", &pathToBundledFile);
#else
  bool success = ghostGetPathToFileInAppBundle("castle-desktop-node-macos", &pathToBundledFile);
#endif

  // TODO: handle failure

  FILE *pipe = popen(pathToBundledFile, "r");
  if (!pipe) {
    throw std::runtime_error("popen() failed!");
  }

  char buffer[512];
  fgets(buffer, sizeof buffer, pipe);
  std::string result = buffer;

  // leave pipe open. server needs to run in background

  return result;
}
