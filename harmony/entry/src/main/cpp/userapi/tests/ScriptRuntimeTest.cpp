#include "ScriptRuntime.h"

#include <fstream>
#include <iostream>
#include <sstream>
#include <stdexcept>

namespace {
void require(bool condition, const std::string& message) {
  if (!condition) throw std::runtime_error(message);
}

void expectFailure(lx::ScriptRuntime& runtime, const std::string& script, const std::string& message) {
  bool failed = false;
  try {
    runtime.evaluate(script, "failure.js");
  } catch (const std::exception& error) {
    failed = std::string(error.what()).find(message) != std::string::npos;
  }
  require(failed, "Expected script failure containing " + message);
}
}

int main(int argumentCount, char** arguments) {
  try {
    require(argumentCount == 2, "Preload path required");
    std::ifstream file(arguments[1]);
    require(file.good(), "Cannot open Android preload");
    std::ostringstream preload;
    preload << file.rdbuf();
    std::vector<std::vector<std::string>> events;
    std::vector<std::string> timers;
    auto host = [&](const std::string& name, const std::vector<std::string>& values) -> std::string {
      if (name == "__lx_native_call__") events.push_back(values);
      else if (name == "__lx_native_call__set_timeout") timers.push_back(values[0]);
      else if (name == "__lx_native_call__utils_str2md5") return "mock-md5";
      return "";
    };
    lx::ScriptRuntime runtime(host);
    runtime.evaluate(preload.str(), "preload.js");
    runtime.call("lx_setup", {"test-key", "test-id", "Test source", "", "1", "", "", "test-script"});
    runtime.evaluate(R"(
      lx.on(lx.EVENT_NAMES.request, async ({info}) => {
        if (info.mode === 'throw') throw new Error('source failed');
        if (info.mode === 'network') return new Promise((resolve, reject) => {
          lx.request('https://example.test/song', {}, (error, response, body) => error ? reject(error) : resolve(body.url));
        });
        if (info.mode === 'timer') return new Promise(resolve => setTimeout(() => resolve('https://example.test/timer.mp3'), 10));
        return 'https://example.test/song.mp3';
      });
      lx.send(lx.EVENT_NAMES.inited, {sources: {kw: {type: 'music', actions: ['musicUrl'], qualitys: ['128k']}}});
    )", "source.js");
    require(events.size() == 1 && events[0][1] == "init" && events[0][2].find("\"status\":true") != std::string::npos, "Init event missing");
    runtime.call("__lx_native__", {"wrong-key", "request", "{}"});
    require(events.size() == 1, "Invalid key emitted event");
    runtime.call("__lx_native__", {"test-key", "request", R"({"requestKey":"normal","data":{"source":"kw","action":"musicUrl","info":{"type":"128k"}}})"});
    require(events.back()[1] == "response" && events.back()[2].find("https://example.test/song.mp3") != std::string::npos, "Promise response missing");
    runtime.call("__lx_native__", {"test-key", "request", R"({"requestKey":"broken","data":{"source":"kw","action":"musicUrl","info":{"mode":"throw"}}})"});
    require(events.back()[2].find("source failed") != std::string::npos, "Script rejection missing");
    runtime.call("__lx_native__", {"test-key", "request", R"({"requestKey":"timer","data":{"source":"kw","action":"musicUrl","info":{"mode":"timer","type":"128k"}}})"});
    require(!timers.empty(), "Timer not scheduled");
    runtime.call("__lx_native__", {"test-key", "__set_timeout__", timers.back()});
    require(events.back()[2].find("timer.mp3") != std::string::npos, "Timer promise did not settle");
    runtime.call("__lx_native__", {"test-key", "request", R"({"requestKey":"network","data":{"source":"kw","action":"musicUrl","info":{"mode":"network","type":"128k"}}})"});
    require(events.back()[1] == "request", "Network request missing");
    auto requestJson = events.back()[2];
    auto keyBegin = requestJson.find("\"requestKey\":\"") + 14;
    auto keyEnd = requestJson.find('"', keyBegin);
    auto requestKey = requestJson.substr(keyBegin, keyEnd - keyBegin);
    runtime.call("__lx_native__", {"test-key", "response", "{\"requestKey\":\"" + requestKey + "\",\"error\":null,\"response\":{\"statusCode\":200,\"body\":{\"url\":\"https://example.test/network.mp3\"}}}"});
    require(events.back()[1] == "response" && events.back()[2].find("network.mp3") != std::string::npos, "Network callback bridge failed");
    require(runtime.evaluate("typeof process + ':' + typeof require + ':' + typeof std", "sandbox.js") == "undefined:undefined:undefined", "Host globals exposed");
    expectFailure(runtime, "eval('1')", "eval is not available");
    expectFailure(runtime, "new Function('return 1')", "Dynamic code execution");
    expectFailure(runtime, "throw new Error('probe error')", "probe error");
    auto started = std::chrono::steady_clock::now();
    expectFailure(runtime, "while (true) {}", "timed out");
    auto elapsed = std::chrono::steady_clock::now() - started;
    require(elapsed < std::chrono::seconds(6), "Execution interrupt exceeded six seconds");
    require(runtime.evaluate("1 + 1", "recovery.js") == "2", "Runtime did not recover after interrupt");
    lx::ScriptRuntime promiseLoop(host, 100);
    expectFailure(promiseLoop, "function loop() { Promise.resolve().then(loop) }; loop()", "timed out");
    lx::ScriptRuntime memoryLimit(host);
    expectFailure(memoryLimit, "const blocks = []; while (true) blocks.push(new Uint8Array(1024 * 1024))", "out of memory");
    lx::ScriptRuntime isolated(host);
    require(isolated.evaluate("typeof lx", "isolated.js") == "undefined", "Script contexts share globals");
    std::cout << "PASS: preload, init, promises, timer, network bridge, errors, sandbox, timeout, memory, isolation\n";
    return 0;
  } catch (const std::exception& error) {
    std::cerr << "FAIL: " << error.what() << '\n';
    return 1;
  }
}
