#!/usr/bin/env bash
# Android release build script (arm64-v8a only) for lx-music-mobile
# 环境变量和 Gradle 路径已固化，签名和架构参数走 ~/.gradle/gradle.properties 不出现明文

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT/android"

export PATH="/home/joe/.nvm/versions/node/v22.23.2/bin:/home/joe/tools/jdk-17.0.20.1+1/bin:$PATH"
export JAVA_HOME=/home/joe/tools/jdk-17.0.20.1+1
export ANDROID_HOME=/home/joe/android-sdk
export ANDROID_SDK_ROOT=/home/joe/android-sdk

/home/joe/tools/gradle-8.8/bin/gradle assembleRelease "$@"

echo ""
echo "── 产物 ──"
ls -lh "$PROJECT_ROOT/android/app/build/outputs/apk/release/"*.apk 2>/dev/null || echo "未找到 APK"
