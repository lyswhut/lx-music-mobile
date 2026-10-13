# QuickJS source

Vendored from https://bellard.org/quickjs/quickjs-2025-09-13-2.tar.xz.

- Version: 2025-09-13 (second archive revision).
- Archive SHA256: `996c6b5018fc955ad4d06426d0e9cb713685a00c825aa5c0418bd53f7df8b0b4`.
- License: MIT, retained in `LICENSE` and the upstream sources.
- Only the engine and its required headers are included; no `quickjs-libc` filesystem, process, or network bindings are linked.
- Upstream sources are unchanged. The upstream `VERSION` file is omitted because it conflicts with C++ `<version>` on Windows. `CMakeLists.txt` is the local build integration.
