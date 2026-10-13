#include <fbjni/fbjni.h>

#include "NativeProxy.h"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::jni::initialize(
      vm, [] { rnscreens::NativeProxy::registerNatives(); });
}
