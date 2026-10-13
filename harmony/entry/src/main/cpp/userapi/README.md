# Custom source runtime

`ScriptRuntime` owns one QuickJS context on its calling thread. Harmony creates it inside `UserApiWorker.ets`; the UI TurboModule exchanges structured messages with that worker. No QuickJS value crosses threads.

The worker loads a generated Harmony adaptation of the Android preload, preserving `lx` source API 2.0.0 and its event protocol. The adaptation routes buffer conversion through native UTF-8 and Base64 callbacks to preserve binary bytes and Unicode, including emoji. Network requests and cancellation use the existing React Native request bridge. Synchronous native callbacks provide Base64, MD5, AES and RSA inside the worker. Console events retain the Android event shape.

Every native evaluation, function call and pending Promise job batch shares a five second deadline. Infinite loops and endless microtasks are interrupted by QuickJS. Each context has a 64 MiB allocation limit and a 512 KiB stack limit. Initialization must emit its init event within 20 seconds after evaluation. Pending source requests still use the existing app's 20 second network timeout.

Destroy messages release timers and the runtime, then close the worker. Generations discard stale resource-loading results and old worker events when sources change. An execution failure closes that worker; loading another source creates a fresh context. There are no QuickJS libc filesystem, process or network bindings.

## Offline tests

Linux or WSL with CMake and GCC/Clang:

```sh
node scripts/prepare-harmony-assets.mjs
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

The worker test transpiles the actual ETS files with the repository's TypeScript package, runs the real native addon and generated Harmony preload on Node worker threads, and substitutes Harmony worker/resource/crypto APIs. It covers event flow, network responses/cancellation, binary and Unicode buffer conversion, timers, callbacks, load/request loops, init timeout, source replacement and disposal. This verifies logic and the portable NAPI bridge; it does not establish Harmony worker/NAPI behavior on a device.

## Device follow-up

Build `npm run bundle-harmony:userapi-smoke`, run `node scripts/harmony-player-probe-server.mjs` with `hdc rport tcp:18080 tcp:18080`, assemble the HAP and run it on Harmony. The entry checks init, callbacks, real HTTP requests, timers, binary/Unicode buffer conversion, MD5/Base64, independent Node AES/RSA vectors, script errors, five second interrupts with an app heartbeat, and recovery. These checks passed on a device on 2026-10-11. Then restore `npm run bundle-harmony` and test importing a real custom source and playing a song; that end-to-end check remains outstanding.

## Comparing source requests

For an Android app running inside a Harmony compatibility container, ordinary Android USB log collection may be unavailable. On the connected phone, the user reported that Zhuoyitong could not import through the Harmony USB reverse port. Use a local diagnostic file instead:

```sh
node scripts/harmony-source-diagnostic-server.mjs --file /path/to/source.js /path/to/diagnostic.js
```

Transfer the file to storage accessible to the Android app, then use Settings → Basic → Custom source management → Import → Local import and select the added `[诊断]` source. Enable Settings → Other → Log → Record custom source logs before selecting it and playing a song. View log contains `[LX_SOURCE_HTTP]` records with request URLs, selected headers, and response status codes. Local mode makes no collector requests and requires neither a server nor USB forwarding. Harmony's shell cannot write the current phone's public files directory; transferring through the user's file manager is still needed. A remote loader is unsuitable because the original preload disables `eval` and dynamic Function execution.

For devices that can reach the reverse port, `node scripts/harmony-source-diagnostic-server.mjs /path/to/source.js` and `hdc rport tcp:18080 tcp:18080` also support importing `http://127.0.0.1:18080/source.js`. That mode sends records to the terminal through `/events` as well as the app log.

The wrapper preserves the original script metadata and raw script for integrity checks, request options, callback arguments, and cancellation. It redacts headers other than User-Agent, ver, source-ver, tag, Accept and Content-Type, and does not record request bodies or response URLs. The `source_diagnostic` test exercises both modes against the actual frozen preload and native QuickJS bridge. After comparison, select the original source and remove the diagnostic source. If using the server, stop it and run `hdc fport rm tcp:18080 tcp:18080`. Third-party scripts are supplied locally and are not committed.
