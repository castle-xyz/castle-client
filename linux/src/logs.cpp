#include "logs.h"
#include "json.hpp"
#include "spdlog/sinks/rotating_file_sink.h"
#include <fstream>
#include <iostream>
#include <stdarg.h>
#include <stdio.h>

using json = nlohmann::json;

Logs::Logs(std::string rootDirectory) {
  // Create a file rotating logger with 5mb size max and 3 rotated files
  auto rotating_logger = spdlog::rotating_logger_mt("castle_gamelift_logger",
                                                    rootDirectory + "castle.log", 1048576 * 5, 3);
  spdlog::set_default_logger(rotating_logger);
  spdlog::set_pattern("%v");
}

void Logs::setUrl(std::string url) { mUrl = url; }

void Logs::setPort(int port) { mPort = port; }

void Logs::log(const char *format, ...) {
  va_list args;
  va_start(args, format);
  char buffer[1000];
  vsnprintf(buffer, 1000, format, args);
  va_end(args);

  std::string str = std::string(buffer);
  logInternal(str, false);
}

void Logs::logLua(const char *format, ...) {
  va_list args;
  va_start(args, format);
  char buffer[1000];
  vsnprintf(buffer, 1000, format, args);
  va_end(args);

  std::string str = std::string(buffer);
  logInternal(str, true);
}

void Logs::log(std::string str) { logInternal(str, false); }

void Logs::logLua(std::string str) { logInternal(str, true); }

void Logs::logInternal(std::string str, bool isLua) {
  time_t _tm = time(NULL);
  struct tm *curtime = localtime(&_tm);
  std::string formattedTime = std::string(asctime(curtime));
  formattedTime.erase(std::remove(formattedTime.begin(), formattedTime.end(), '\n'),
                      formattedTime.end());
  json j;
  j["time"] = formattedTime;
  j["port"] = std::to_string(mPort);
  j["url"] = mUrl;
  j["logs"] = str;
  j["is_lua"] = isLua;

  spdlog::info(j.dump());
}
