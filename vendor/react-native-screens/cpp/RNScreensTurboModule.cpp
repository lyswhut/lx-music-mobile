#include "RNScreensTurboModule.h"

using namespace facebook;

namespace RNScreens {

const char RNScreensTurboModule::MODULE_NAME[] = "RNScreensTurboModule";

std::function<std::array<int, 2>(int)> RNScreensTurboModule::startTransition_;
std::function<void(int, double)> RNScreensTurboModule::updateTransition_;
std::function<void(int, bool)> RNScreensTurboModule::finishTransition_;
std::function<void(int)> RNScreensTurboModule::disableSwipeBackForTopScreen_;

RNScreensTurboModule::RNScreensTurboModule(
    std::function<std::array<int, 2>(int)> startTransition,
    std::function<void(int, double)> updateTransition,
    std::function<void(int, bool)> finishTransition,
    std::function<void(int)> disableSwipeBackForTopScreen) {
  startTransition_ = startTransition;
  updateTransition_ = updateTransition;
  finishTransition_ = finishTransition;
  disableSwipeBackForTopScreen_ = disableSwipeBackForTopScreen;
}

RNScreensTurboModule::~RNScreensTurboModule(){};

jsi::Value RNScreensTurboModule::get(
    jsi::Runtime &rt,
    const jsi::PropNameID &name) {
  if (name.utf8(rt) == "startTransition") {
    return jsi::Function::createFromHostFunction(rt, name, 1, startTransition);
  } else if (name.utf8(rt) == "updateTransition") {
    return jsi::Function::createFromHostFunction(rt, name, 2, updateTransition);
  } else if (name.utf8(rt) == "finishTransition") {
    return jsi::Function::createFromHostFunction(rt, name, 2, finishTransition);
  } else if (name.utf8(rt) == "disableSwipeBackForTopScreen") {
    return jsi::Function::createFromHostFunction(
        rt, name, 1, disableSwipeBackForTopScreen);
  }
  return jsi::Value::undefined();
}

void RNScreensTurboModule::set(
    jsi::Runtime &,
    const jsi::PropNameID &,
    const jsi::Value &){};

std::vector<jsi::PropNameID> RNScreensTurboModule::getPropertyNames(
    jsi::Runtime &rt) {
  std::vector<jsi::PropNameID> properties;
  properties.push_back(jsi::PropNameID::forUtf8(rt, "startTransition"));
  properties.push_back(jsi::PropNameID::forUtf8(rt, "updateTransition"));
  properties.push_back(jsi::PropNameID::forUtf8(rt, "finishTransition"));
  properties.push_back(
      jsi::PropNameID::forUtf8(rt, "disableSwipeBackForTopScreen"));
  return properties;
}

JSI_HOST_FUNCTION(RNScreensTurboModule::startTransition) {
  if (count < 1) {
    throw jsi::JSError(
        rt, "[RNScreens] `startTransition` method requires 1 argument.");
  }
  int stackTag = arguments[0].asNumber();
  auto screenTags = startTransition_(stackTag);
  jsi::Object screenTagsObject(rt);
  jsi::Value topScreenTag, belowTopScreenTag, canStartTransition;
  if (screenTags[0] > -1) {
    topScreenTag = jsi::Value(screenTags[0]);
    belowTopScreenTag = jsi::Value(screenTags[1]);
    canStartTransition = jsi::Value(true);
  } else {
    topScreenTag = jsi::Value(-1);
    belowTopScreenTag = jsi::Value(-1);
    canStartTransition = jsi::Value(false);
  }
  screenTagsObject.setProperty(rt, "topScreenTag", topScreenTag);
  screenTagsObject.setProperty(rt, "belowTopScreenTag", belowTopScreenTag);
  screenTagsObject.setProperty(rt, "canStartTransition", canStartTransition);
  return screenTagsObject;
}

JSI_HOST_FUNCTION(RNScreensTurboModule::updateTransition) {
  if (count < 2) {
    throw jsi::JSError(
        rt, "[RNScreens] `updateTransition` requires 2 arguments.");
  }
  int stackTag = arguments[0].asNumber();
  double progress = arguments[1].asNumber();
  updateTransition_(stackTag, progress);
  return jsi::Value::undefined();
}

JSI_HOST_FUNCTION(RNScreensTurboModule::finishTransition) {
  if (count < 2) {
    throw jsi::JSError(
        rt, "[RNScreens] `finishTransition` requires 2 arguments.");
  }
  int stackTag = arguments[0].asNumber();
  bool canceled = arguments[1].getBool();
  finishTransition_(stackTag, canceled);
  return jsi::Value::undefined();
}

JSI_HOST_FUNCTION(RNScreensTurboModule::disableSwipeBackForTopScreen) {
  if (count < 1) {
    throw jsi::JSError(
        rt, "[RNScreens] `startTransition` method requires 1 argument.");
  }
  int stackTag = arguments[0].asNumber();
  disableSwipeBackForTopScreen_(stackTag);
  return jsi::Value::undefined();
}

} // namespace RNScreens
