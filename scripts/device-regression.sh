#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Build two signed test fixtures before returning to the normal baseline version.
bash ./gradlew --no-daemon :app:assembleDebug -PnativeVersionName=0.1.1 -PnativeVersionCode=2
mkdir -p build/update-fixtures
cp app/build/outputs/apk/debug/app-debug.apk build/update-fixtures/updated.apk
rm -f build/update-fixtures/wrong-signer.jks
keytool -genkeypair -keystore build/update-fixtures/wrong-signer.jks -storepass fixturepass -keypass fixturepass -alias fixture -keyalg RSA -validity 2 -dname 'CN=Migration Fixture' -noprompt
"$ANDROID_HOME/build-tools/36.0.0/apksigner" sign --ks build/update-fixtures/wrong-signer.jks --ks-pass pass:fixturepass --key-pass pass:fixturepass --out build/update-fixtures/wrong-signer.apk build/update-fixtures/updated.apk
adb push build/update-fixtures/updated.apk /data/local/tmp/lx-native-update-fixture.apk
adb push build/update-fixtures/wrong-signer.apk /data/local/tmp/lx-native-wrong-signer.apk
# Exercise first-use permission dialogs before download tests grant legacy storage access.
bash ./gradlew --no-daemon :app:connectedDebugAndroidTest \
  -Pandroid.testInstrumentationRunnerArguments.class=cn.toside.music.nativeapp.ui.PermissionFlowTest
mkdir -p build/permission-flow/reports build/permission-flow/results
cp -a app/build/reports/androidTests/. build/permission-flow/reports/
cp -a app/build/outputs/androidTest-results/. build/permission-flow/results/
bash ./gradlew --no-daemon :app:connectedDebugAndroidTest \
  -Pandroid.testInstrumentationRunnerArguments.notClass=cn.toside.music.nativeapp.ui.PermissionFlowTest \
  -Pandroid.testInstrumentationRunnerArguments.updateFixture=/data/local/tmp/lx-native-update-fixture.apk \
  -Pandroid.testInstrumentationRunnerArguments.wrongSignerFixture=/data/local/tmp/lx-native-wrong-signer.apk
