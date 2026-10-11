# Custom source runtime

`ScriptRuntime` owns one QuickJS context on its calling thread. Harmony creates it inside `UserApiWorker.ets`; the UI TurboModule exchanges structured messages with that worker. No QuickJS value crosses threads.

The worker loads the existing Android preload, preserving `lx` source API 2.0.0 and its event protocol. Network requests and cancellation use the existing React Native request bridge. Synchronous native callbacks provide Base64, MD5, AES and RSA inside the worker. Console events retain the Android event shape.

Every native evaluation, function call and pending Promise job batch shares a five second deadline. Infinite loops and endless microtasks are interrupted by QuickJS. Each context has a 64 MiB allocation limit and a 512 KiB stack limit. Initialization must emit its init event within 20 seconds after evaluation. Pending source requests still use the existing app's 20 second network timeout.

Destroy messages release timers and the runtime, then close the worker. Generations discard stale resource-loading results and old worker events when sources change. An execution failure closes that worker; loading another source creates a fresh context. There are no QuickJS libc filesystem, process or network bindings.

## Offline tests

Linux or WSL with CMake and GCC/Clang:

```sh
cmake -S harmony/entry/src/main/cpp/userapi/tests -B /tmp/lx-user-api-tests -DCMAKE_BUILD_TYPE=Release
cmake --build /tmp/lx-user-api-tests -j4
ctest --test-dir /tmp/lx-user-api-tests --output-on-failure
```

To also run the NAPI and ETS host/worker tests, configure with paths to a Linux Node distribution (Node 24 is tested):

```sh
cmake -S harmony/entry/src/main/cpp/userapi/tests -B /tmp/lx-user-api-tests \
  -DLX_NODE_INCLUDE=/path/to/node/include/node \
  -DLX_NODE_EXECUTABLE=/path/to/node/bin/node
cmake --build /tmp/lx-user-api-tests -j4
ctest --test-dir /tmp/lx-user-api-tests --output-on-failure
```

The worker test transpiles the actual ETS files with the repository's TypeScript package, runs the real native addon and Android preload on Node worker threads, and substitutes Harmony worker/resource/crypto APIs. It covers event flow, network responses/cancellation, timers, callbacks, load/request loops, init timeout, source replacement and disposal. This verifies logic and the portable NAPI bridge; it does not establish Harmony worker/NAPI behavior on a device.

## Device follow-up

Build `npm run bundle-harmony:userapi-smoke`, assemble the HAP and run it on Harmony. The entry checks init, callbacks, timers, MD5/Base64, script errors, five second interrupts with an app heartbeat, and recovery. Then restore `npm run bundle-harmony` and test importing a real custom source and playing a song. These device checks remain outstanding.
