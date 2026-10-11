#include <jni.h>
#include <jsi/jsi.h>
#include <array>
#include <mutex>
#include "RNScreensTurboModule.h"

using namespace facebook;

jobject globalThis;

extern "C" JNIEXPORT void JNICALL
Java_com_swmansion_rnscreens_ScreensModule_nativeInstall(
    JNIEnv *env,
    jobject thiz,
    jlong jsiPtr) {
  auto runtime = reinterpret_cast<jsi::Runtime *>(jsiPtr);
  if (!runtime) {
    return;
  }
  jsi::Runtime &rt = *runtime;
  globalThis = env->NewGlobalRef(thiz);
  JavaVM *jvm;
  env->GetJavaVM(&jvm);

  const auto &startTransition = [jvm](int stackTag) -> std::array<int, 2> {
    JNIEnv *currentEnv;
    if (jvm->AttachCurrentThread(&currentEnv, nullptr) != JNI_OK) {
      return {0, 0};
    }
    jclass javaClass = currentEnv->GetObjectClass(globalThis);
    jmethodID methodID = currentEnv->GetMethodID(
        javaClass, "startTransition", "(Ljava/lang/Integer;)[I");
    jclass integerClass = currentEnv->FindClass("java/lang/Integer");
    jmethodID integerConstructor =
        currentEnv->GetMethodID(integerClass, "<init>", "(I)V");
    jobject integerArg =
        currentEnv->NewObject(integerClass, integerConstructor, stackTag);
    jintArray resultArray = (jintArray)currentEnv->CallObjectMethod(
        globalThis, methodID, integerArg);
    std::array<int, 2> result = {-1, -1};
    jint *elements = currentEnv->GetIntArrayElements(resultArray, nullptr);
    if (elements != nullptr) {
      result[0] = elements[0];
      result[1] = elements[1];
      currentEnv->ReleaseIntArrayElements(resultArray, elements, JNI_ABORT);
    }
    return result;
  };

  const auto &updateTransition = [jvm](int stackTag, double progress) {
    JNIEnv *currentEnv;
    if (jvm->AttachCurrentThread(&currentEnv, nullptr) != JNI_OK) {
      return;
    }
    jclass javaClass = currentEnv->GetObjectClass(globalThis);
    jmethodID methodID =
        currentEnv->GetMethodID(javaClass, "updateTransition", "(D)V");
    currentEnv->CallVoidMethod(globalThis, methodID, progress);
  };

  const auto &finishTransition = [jvm](int stackTag, bool canceled) {
    JNIEnv *currentEnv;
    if (jvm->AttachCurrentThread(&currentEnv, nullptr) != JNI_OK) {
      return;
    }
    jclass javaClass = currentEnv->GetObjectClass(globalThis);
    jmethodID methodID = currentEnv->GetMethodID(
        javaClass, "finishTransition", "(Ljava/lang/Integer;Z)V");
    jclass integerClass = currentEnv->FindClass("java/lang/Integer");
    jmethodID integerConstructor =
        currentEnv->GetMethodID(integerClass, "<init>", "(I)V");
    jobject integerArg =
        currentEnv->NewObject(integerClass, integerConstructor, stackTag);
    currentEnv->CallVoidMethod(globalThis, methodID, integerArg, canceled);
  };

  const auto &disableSwipeBackForTopScreen = [](int _stackTag) {
    // no implementation for Android
  };

  auto rnScreensModule = std::make_shared<RNScreens::RNScreensTurboModule>(
      startTransition,
      updateTransition,
      finishTransition,
      disableSwipeBackForTopScreen);
  auto rnScreensModuleHostObject =
      jsi::Object::createFromHostObject(rt, rnScreensModule);
  rt.global().setProperty(
      rt,
      RNScreens::RNScreensTurboModule::MODULE_NAME,
      std::move(rnScreensModuleHostObject));
}

void JNICALL JNI_OnUnload(JavaVM *jvm, void *) {
  JNIEnv *env;
  if (jvm->GetEnv(reinterpret_cast<void **>(&env), JNI_VERSION_1_6) != JNI_OK) {
    return;
  }
  if (globalThis != nullptr) {
    env->DeleteGlobalRef(globalThis);
    globalThis = nullptr;
  }
}
