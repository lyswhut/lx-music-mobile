#include "NativeApi.h"

#include <memory>
#include <stdexcept>
#include <string>
#include <vector>

#include "ScriptRuntime.h"

namespace {
void check(napi_status status) {
  if (status != napi_ok) throw std::runtime_error("Native script bridge failed");
}

class HandleScope {
 public:
  explicit HandleScope(napi_env environment) : environment_(environment) {
    check(napi_open_handle_scope(environment_, &scope_));
  }
  ~HandleScope() {
    napi_close_handle_scope(environment_, scope_);
  }
 private:
  napi_env environment_;
  napi_handle_scope scope_;
};

std::string getString(napi_env environment, napi_value value) {
  size_t length = 0;
  check(napi_get_value_string_utf8(environment, value, nullptr, 0, &length));
  if (length > 8 * 1024 * 1024) throw std::runtime_error("Native string exceeds 8 MiB limit");
  std::string result(length + 1, '\0');
  check(napi_get_value_string_utf8(environment, value, result.data(), result.size(), &length));
  result.resize(length);
  return result;
}

napi_value makeString(napi_env environment, const std::string& text) {
  napi_value result;
  check(napi_create_string_utf8(environment, text.data(), text.size(), &result));
  return result;
}

struct Binding {
  napi_env environment;
  napi_ref callback = nullptr;
  std::unique_ptr<lx::ScriptRuntime> runtime;

  explicit Binding(napi_env environment) : environment(environment) {}

  ~Binding() {
    close();
  }

  void close() {
    runtime.reset();
    if (callback) napi_delete_reference(environment, callback);
    callback = nullptr;
  }

  std::string invoke(const std::string& name, const std::vector<std::string>& arguments) {
    HandleScope scope(environment);
    napi_value function;
    check(napi_get_reference_value(environment, callback, &function));
    napi_value receiver;
    check(napi_get_undefined(environment, &receiver));
    napi_value values;
    check(napi_create_array_with_length(environment, arguments.size(), &values));
    for (size_t index = 0; index < arguments.size(); ++index) {
      check(napi_set_element(environment, values, index, makeString(environment, arguments[index])));
    }
    napi_value parameters[] = {makeString(environment, name), values};
    napi_value result;
    auto status = napi_call_function(environment, receiver, function, 2, parameters, &result);
    if (status == napi_pending_exception) {
      napi_value error;
      check(napi_get_and_clear_last_exception(environment, &error));
      napi_value message;
      check(napi_coerce_to_string(environment, error, &message));
      throw std::runtime_error(getString(environment, message));
    }
    check(status);
    napi_valuetype type;
    check(napi_typeof(environment, result, &type));
    return type == napi_string ? getString(environment, result) : "";
  }
};

Binding* getBinding(napi_env environment, napi_value value) {
  void* pointer = nullptr;
  check(napi_get_value_external(environment, value, &pointer));
  auto* binding = static_cast<Binding*>(pointer);
  if (!binding || !binding->runtime) throw std::runtime_error("Script runtime has been destroyed");
  return binding;
}

void finalize(napi_env, void* pointer, void*) {
  delete static_cast<Binding*>(pointer);
}

std::vector<napi_value> parameters(napi_env environment, napi_callback_info info, size_t expected) {
  std::vector<napi_value> values(expected);
  size_t count = expected;
  check(napi_get_cb_info(environment, info, &count, values.data(), nullptr, nullptr));
  if (count != expected) throw std::runtime_error("Incorrect native argument count");
  return values;
}

napi_value create(napi_env environment, napi_callback_info info) {
  try {
    auto values = parameters(environment, info, 1);
    auto binding = std::make_unique<Binding>(environment);
    check(napi_create_reference(environment, values[0], 1, &binding->callback));
    auto* pointer = binding.get();
    binding->runtime = std::make_unique<lx::ScriptRuntime>([pointer](const std::string& name, const std::vector<std::string>& values) {
      return pointer->invoke(name, values);
    });
    napi_value result;
    check(napi_create_external(environment, binding.get(), finalize, nullptr, &result));
    binding.release();
    return result;
  } catch (const std::exception& error) {
    napi_throw_error(environment, nullptr, error.what());
    return nullptr;
  }
}

napi_value evaluate(napi_env environment, napi_callback_info info) {
  try {
    auto values = parameters(environment, info, 3);
    return makeString(environment, getBinding(environment, values[0])->runtime->evaluate(getString(environment, values[1]), getString(environment, values[2])));
  } catch (const std::exception& error) {
    napi_throw_error(environment, nullptr, error.what());
    return nullptr;
  }
}

napi_value call(napi_env environment, napi_callback_info info) {
  try {
    auto values = parameters(environment, info, 3);
    uint32_t count = 0;
    check(napi_get_array_length(environment, values[2], &count));
    if (count > 32) throw std::runtime_error("Too many native arguments");
    std::vector<std::string> arguments;
    for (uint32_t index = 0; index < count; ++index) {
      napi_value value;
      check(napi_get_element(environment, values[2], index, &value));
      arguments.push_back(getString(environment, value));
    }
    return makeString(environment, getBinding(environment, values[0])->runtime->call(getString(environment, values[1]), arguments));
  } catch (const std::exception& error) {
    napi_throw_error(environment, nullptr, error.what());
    return nullptr;
  }
}

napi_value destroy(napi_env environment, napi_callback_info info) {
  try {
    auto values = parameters(environment, info, 1);
    void* pointer = nullptr;
    check(napi_get_value_external(environment, values[0], &pointer));
    if (pointer) static_cast<Binding*>(pointer)->close();
    napi_value result;
    check(napi_get_undefined(environment, &result));
    return result;
  } catch (const std::exception& error) {
    napi_throw_error(environment, nullptr, error.what());
    return nullptr;
  }
}

napi_value initialize(napi_env environment, napi_value exports) {
  napi_property_descriptor descriptors[] = {
      {"create", nullptr, create, nullptr, nullptr, nullptr, napi_default, nullptr},
      {"evaluate", nullptr, evaluate, nullptr, nullptr, nullptr, napi_default, nullptr},
      {"call", nullptr, call, nullptr, nullptr, nullptr, napi_default, nullptr},
      {"destroy", nullptr, destroy, nullptr, nullptr, nullptr, napi_default, nullptr}};
  napi_define_properties(environment, exports, sizeof(descriptors) / sizeof(descriptors[0]), descriptors);
  return exports;
}

napi_module module = {1, 0, nullptr, initialize, "lx_user_api", nullptr, {nullptr}};
}

extern "C" __attribute__((constructor)) void registerUserApiModule() {
  napi_module_register(&module);
}
