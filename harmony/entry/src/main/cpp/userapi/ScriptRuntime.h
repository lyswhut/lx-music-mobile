#pragma once

#include <chrono>
#include <functional>
#include <string>
#include <vector>

#include "quickjs.h"

namespace lx {

class ScriptRuntime {
 public:
  using HostCall = std::function<std::string(const std::string&, const std::vector<std::string>&)>;

  explicit ScriptRuntime(HostCall hostCall, int timeoutMilliseconds = 5000);
  ~ScriptRuntime();
  ScriptRuntime(const ScriptRuntime&) = delete;
  ScriptRuntime& operator=(const ScriptRuntime&) = delete;

  std::string evaluate(const std::string& source, const std::string& filename);
  std::string call(const std::string& name, const std::vector<std::string>& arguments);

 private:
  static int interrupt(JSRuntime* runtime, void* opaque);
  static JSValue invokeHost(JSContext* context, JSValueConst receiver, int count, JSValueConst* arguments, int magic);
  void beginExecution();
  void drainJobs();
  std::string finish(JSValue value);
  std::string exception(JSContext* context);
  std::string stringify(JSContext* context, JSValueConst value);

  JSRuntime* runtime_ = nullptr;
  JSContext* context_ = nullptr;
  HostCall hostCall_;
  int timeoutMilliseconds_;
  std::chrono::steady_clock::time_point deadline_;
  bool interrupted_ = false;
};

}
