#pragma once

#include <fbjni/fbjni.h>
#include <react/fabric/JFabricUIManager.h>
#include "RNSScreenRemovalListener.h"

#include <string>

namespace rnscreens {
using namespace facebook;
using namespace facebook::jni;

class NativeProxy : public jni::HybridClass<NativeProxy> {
 public:
  std::shared_ptr<RNSScreenRemovalListener> screenRemovalListener_;
  static auto constexpr kJavaDescriptor =
      "Lcom/swmansion/rnscreens/NativeProxy;";
  static jni::local_ref<jhybriddata> initHybrid(
      jni::alias_ref<jhybridobject> jThis);
  static void registerNatives();

  ~NativeProxy();

 private:
  friend HybridBase;
  jni::global_ref<NativeProxy::javaobject> javaPart_;

  explicit NativeProxy(jni::alias_ref<NativeProxy::javaobject> jThis);

  void nativeAddMutationsListener(
      jni::alias_ref<facebook::react::JFabricUIManager::javaobject>
          fabricUIManager);
};

} // namespace rnscreens
