#ifndef __CASTLE_LOGS_H__
#define __CASTLE_LOGS_H__

#include "timer.h"
#include <string>

class Logs {
private:
  std::string mUrl;
  int mPort = -1;

  void logInternal(std::string str, bool isLua);

public:
  Logs(std::string rootDirectory);
  void log(const char *format, ...);
  void logLua(const char *format, ...);
  void log(std::string str);
  void logLua(std::string str);
  void setUrl(std::string url);
  void setPort(int port);
};

#endif