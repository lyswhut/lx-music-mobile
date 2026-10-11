#include "ScriptRuntime.h"

#include <stdexcept>
#include <utility>

namespace lx {
namespace {
const char* const hostNames[] = {
    "__lx_native_call__", "__lx_native_call__set_timeout",
    "__lx_native_call__utils_str2b64", "__lx_native_call__utils_b642buf",
    "__lx_native_call__utils_str2md5", "__lx_native_call__utils_aes_encrypt",
    "__lx_native_call__utils_rsa_encrypt", "log", "info", "warn", "error"};
const int hostArgumentCounts[] = {3, 2, 1, 1, 1, 4, 3, 1, 1, 1, 1};
}

ScriptRuntime::ScriptRuntime(HostCall hostCall, int timeoutMilliseconds)
    : hostCall_(std::move(hostCall)), timeoutMilliseconds_(timeoutMilliseconds) {
  runtime_ = JS_NewRuntime();
  if (!runtime_) throw std::runtime_error("Unable to create script runtime");
  JS_SetMemoryLimit(runtime_, 64 * 1024 * 1024);
  JS_SetMaxStackSize(runtime_, 512 * 1024);
  JS_SetInterruptHandler(runtime_, interrupt, this);
  context_ = JS_NewContext(runtime_);
  if (!context_) {
    JS_FreeRuntime(runtime_);
    throw std::runtime_error("Unable to create script context");
  }
  JS_SetContextOpaque(context_, this);
  JSValue global = JS_GetGlobalObject(context_);
  for (int index = 0; index < 7; ++index) {
    JS_SetPropertyStr(context_, global, hostNames[index],
        JS_NewCFunctionMagic(context_, invokeHost, hostNames[index], hostArgumentCounts[index], JS_CFUNC_generic_magic, index));
  }
  JSValue console = JS_NewObject(context_);
  for (int index = 7; index < 11; ++index) {
    JS_SetPropertyStr(context_, console, hostNames[index],
        JS_NewCFunctionMagic(context_, invokeHost, hostNames[index], 1, JS_CFUNC_generic_magic, index));
  }
  JS_SetPropertyStr(context_, global, "console", console);
  JS_FreeValue(context_, global);
}

ScriptRuntime::~ScriptRuntime() {
  JS_FreeContext(context_);
  JS_FreeRuntime(runtime_);
}

int ScriptRuntime::interrupt(JSRuntime*, void* opaque) {
  auto* instance = static_cast<ScriptRuntime*>(opaque);
  if (std::chrono::steady_clock::now() < instance->deadline_) return 0;
  instance->interrupted_ = true;
  return 1;
}

void ScriptRuntime::beginExecution() {
  interrupted_ = false;
  deadline_ = std::chrono::steady_clock::now() + std::chrono::milliseconds(timeoutMilliseconds_);
  JS_UpdateStackTop(runtime_);
}

std::string ScriptRuntime::stringify(JSContext* context, JSValueConst value) {
  size_t length = 0;
  const char* text = JS_ToCStringLen(context, &length, value);
  if (!text) throw std::runtime_error("Unable to convert script value to string");
  std::string result(text, length);
  JS_FreeCString(context, text);
  return result;
}

std::string ScriptRuntime::exception(JSContext* context) {
  JSValue error = JS_GetException(context);
  std::string message;
  try {
    message = stringify(context, error);
  } catch (...) {
    message = "Script execution failed";
  }
  JS_FreeValue(context, error);
  return interrupted_ ? "Script execution timed out after " + std::to_string(timeoutMilliseconds_) + "ms" : message;
}

JSValue ScriptRuntime::invokeHost(JSContext* context, JSValueConst, int count, JSValueConst* arguments, int magic) {
  auto* instance = static_cast<ScriptRuntime*>(JS_GetContextOpaque(context));
  try {
    if (count > 32) throw std::runtime_error("Too many native arguments");
    std::vector<std::string> values;
    for (int index = 0; index < count; ++index) {
      auto value = instance->stringify(context, arguments[index]);
      if (value.size() > 8 * 1024 * 1024) throw std::runtime_error("Native argument too long");
      values.push_back(std::move(value));
    }
    auto result = instance->hostCall_(hostNames[magic], values);
    if (magic == 0 || magic == 1 || magic >= 7) return JS_UNDEFINED;
    return JS_NewStringLen(context, result.data(), result.size());
  } catch (const std::exception& error) {
    return JS_ThrowInternalError(context, "%s", error.what());
  }
}

void ScriptRuntime::drainJobs() {
  while (JS_IsJobPending(runtime_)) {
    if (interrupt(runtime_, this)) throw std::runtime_error("Script execution timed out after " + std::to_string(timeoutMilliseconds_) + "ms");
    JSContext* jobContext = nullptr;
    if (JS_ExecutePendingJob(runtime_, &jobContext) < 0) throw std::runtime_error(exception(jobContext));
  }
}

std::string ScriptRuntime::finish(JSValue value) {
  if (JS_IsException(value)) throw std::runtime_error(exception(context_));
  std::string result;
  try {
    if (!JS_IsUndefined(value)) result = stringify(context_, value);
  } catch (...) {
    JS_FreeValue(context_, value);
    throw;
  }
  JS_FreeValue(context_, value);
  drainJobs();
  return result;
}

std::string ScriptRuntime::evaluate(const std::string& source, const std::string& filename) {
  if (source.size() > 8 * 1024 * 1024) throw std::runtime_error("Script exceeds 8 MiB limit");
  beginExecution();
  return finish(JS_Eval(context_, source.data(), source.size(), filename.c_str(), JS_EVAL_TYPE_GLOBAL));
}

std::string ScriptRuntime::call(const std::string& name, const std::vector<std::string>& arguments) {
  beginExecution();
  JSValue global = JS_GetGlobalObject(context_);
  JSValue function = JS_GetPropertyStr(context_, global, name.c_str());
  std::vector<JSValue> values;
  for (const auto& argument : arguments) values.push_back(JS_NewStringLen(context_, argument.data(), argument.size()));
  JSValue result = JS_Call(context_, function, global, static_cast<int>(values.size()), values.data());
  for (JSValue value : values) JS_FreeValue(context_, value);
  JS_FreeValue(context_, function);
  JS_FreeValue(context_, global);
  return finish(result);
}

}
