---
name: android-release-build
description: Build the release APK for this React Native Android project arm64-v8a only. Use when the user asks to build, rebuild, release APK, or package. Single ABI arm64-v8a is the default.
---

# Android Release Build

构建 `lx-music-mobile` 的 Android release APK（arm64-v8a 单架构）。

## 环境实位（本机 Linux，禁止任何下载）

- Android SDK: `/home/joe/android-sdk`
- Gradle: `/home/joe/tools/gradle-8.8/bin/gradle`
- JDK 17: `/home/joe/tools/jdk-17.0.20.1+1`（必须，AGP 8.x 不认 JDK 25）
- Node: `/home/joe/.nvm/versions/node/v22.23.2/bin`（必须，默认 node 是 v16 会挂 `createBundleReleaseJsAndAssets`）

## 签名与架构（已固化在 ~/.gradle/gradle.properties）

- `MYAPP_UPLOAD_STORE_FILE=debug.keystore` 等四个签名参数已在用户级 gradle.properties 里，不走命令行明文
- `reactNativeArchitectures=arm64-v8a` 已固化

## 执行

直接调用项目脚本，不要自己拼环境变量：

```bash
bash scripts/build-release-apk.sh
```

脚本内部已处理好 `PATH`、`JAVA_HOME`、`ANDROID_HOME`、`ANDROID_SDK_ROOT` 和 gradle 路径。

## 产物

- 路径：`android/app/build/outputs/apk/release/lx-music-mobile-v1.9.1-arm64-v8a.apk`
- 大小约 16 MB
- 同目录还会有一个 universal.apk（实际也只含 arm64 so，不可分发）

## 注意事项

- 禁止 `./gradlew`，wrapper 指向的 gradle 版本本地没有，会触发外网下载
- 禁止命令行明文签名密码，已固化在用户级 gradle.properties
- 静态资源换扩展名时先 `rm -rf android/app/build/generated/res/createBundleReleaseJsAndAssets` 再构建
- 只读错误段落，不要把整份日志读进上下文
