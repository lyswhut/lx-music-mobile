#pragma once

#ifdef ANDROID
#include <fbjni/fbjni.h>
#endif
#include <react/debug/react_native_assert.h>
#include <react/renderer/components/rnscreens/Props.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include "RNSScreenShadowNode.h"
#include "utils/RectUtil.h"

namespace facebook {
namespace react {

using namespace rnscreens;

class RNSScreenComponentDescriptor final
    : public ConcreteComponentDescriptor<RNSScreenShadowNode> {
 public:
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;

  static constexpr const char *kScreenDummyLayoutHelperClass =
      "com/swmansion/rnscreens/utils/ScreenDummyLayoutHelper";

  void adopt(ShadowNode &shadowNode) const override {
    react_native_assert(dynamic_cast<RNSScreenShadowNode *>(&shadowNode));
    auto &screenShadowNode = static_cast<RNSScreenShadowNode &>(shadowNode);

    react_native_assert(
        dynamic_cast<YogaLayoutableShadowNode *>(&screenShadowNode));
    auto &layoutableShadowNode =
        dynamic_cast<YogaLayoutableShadowNode &>(screenShadowNode);

    auto state =
        std::static_pointer_cast<const RNSScreenShadowNode::ConcreteState>(
            shadowNode.getState());
    auto stateData = state->getData();

#ifdef ANDROID
    if (stateData.frameSize.width != 0 && stateData.frameSize.height != 0) {
      // When we receive dimensions from JVM side we can remove padding used for
      // correction, and we can stop applying height correction for the frame.
      // We want to leave top offset correction though intact.
      // TODO: In future, when we have dynamic header height we might want to
      // update Y offset correction here.

#ifdef REACT_NATIVE_DEBUG
      // We use the fact that height correction is disabled once we receive
      // state from the native, so when we have incoming state & height
      // correction is still enabled, we know this is the very first native
      // state update.
      if (screenShadowNode.getFrameCorrectionModes().check(
              FrameCorrectionModes::Mode::FrameHeightCorrection) &&
          !checkFrameSizesEqualWithEps(
              screenShadowNode.layoutMetrics_.frame.size,
              stateData.frameSize)) {
        LOG(ERROR)
            << "[RNScreens] The first frame received from state update: "
            << stateData.frameSize.width << "x" << stateData.frameSize.height
            << " differs from the one expected: "
            << screenShadowNode.layoutMetrics_.frame.size.width << "x"
            << screenShadowNode.layoutMetrics_.frame.size.height
            << ". This is most likely a react-native-screens library bug. Please report this at https://github.com/software-mansion/react-native-screens/issues";
      }
#endif

      screenShadowNode.setPadding({0, 0, 0, 0});
      screenShadowNode.getFrameCorrectionModes().unset(
          FrameCorrectionModes::Mode::FrameHeightCorrection);

      layoutableShadowNode.setSize(
          Size{stateData.frameSize.width, stateData.frameSize.height});
    } else {
      // This code path should be executed only on the very first (few)
      // layout(s), when we haven't received state update from JVM side yet.

      auto headerConfigChildOpt = findHeaderConfigChild(layoutableShadowNode);

      // During creation of the shadow node children are not attached yet.
      // We also do not want to set any padding in case.
      if (headerConfigChildOpt) {
        const auto &headerConfigChild = headerConfigChildOpt->get();
        const auto &headerProps =
            *std::static_pointer_cast<const RNSScreenStackHeaderConfigProps>(
                headerConfigChild->getProps());

        const auto headerHeight = headerProps.hidden
            ? 0.f
            : findHeaderHeight(
                  headerProps.titleFontSize, headerProps.title.empty())
                  .value_or(0.f);

        screenShadowNode.setPadding({0, 0, 0, headerHeight});
        screenShadowNode.setHeaderHeight(headerHeight);
        screenShadowNode.getFrameCorrectionModes().set(
            FrameCorrectionModes::Mode(
                FrameCorrectionModes::Mode::FrameHeightCorrection |
                FrameCorrectionModes::Mode::FrameOriginCorrection));
      }
    }
#else
    if (stateData.frameSize.width != 0 && stateData.frameSize.height != 0) {
      layoutableShadowNode.setSize(
          Size{stateData.frameSize.width, stateData.frameSize.height});
    }
#endif // ANDROID
    ConcreteComponentDescriptor::adopt(shadowNode);
  }

  std::optional<std::reference_wrapper<const ShadowNode::Shared>>
  findHeaderConfigChild(
      const YogaLayoutableShadowNode &screenShadowNode) const {
    for (const ShadowNode::Shared &child : screenShadowNode.getChildren()) {
      if (std::strcmp(
              child->getComponentName(), "RNSScreenStackHeaderConfig") == 0) {
        return {std::cref(child)};
      }
    }
    return {};
  }

#ifdef ANDROID
  std::optional<float> findHeaderHeight(
      const int fontSize,
      const bool isTitleEmpty) const {
    JNIEnv *env = facebook::jni::Environment::current();

    if (env == nullptr) {
      LOG(ERROR) << "[RNScreens] Failed to retrieve env\n";
      return {};
    }

    jclass layoutHelperClass = env->FindClass(kScreenDummyLayoutHelperClass);

    if (layoutHelperClass == nullptr) {
      LOG(ERROR) << "[RNScreens] Failed to find class with id "
                 << kScreenDummyLayoutHelperClass;
      return {};
    }

    jmethodID computeDummyLayoutID =
        env->GetMethodID(layoutHelperClass, "computeDummyLayout", "(IZ)F");

    if (computeDummyLayoutID == nullptr) {
      LOG(ERROR)
          << "[RNScreens] Failed to retrieve computeDummyLayout method ID";
      return {};
    }

    jmethodID getInstanceMethodID = env->GetStaticMethodID(
        layoutHelperClass,
        "getInstance",
        "()Lcom/swmansion/rnscreens/utils/ScreenDummyLayoutHelper;");

    if (getInstanceMethodID == nullptr) {
      LOG(ERROR) << "[RNScreens] Failed to retrieve getInstanceMethodID";
      return {};
    }

    jobject packageInstance =
        env->CallStaticObjectMethod(layoutHelperClass, getInstanceMethodID);

    if (packageInstance == nullptr) {
      LOG(ERROR)
          << "[RNScreens] Failed to retrieve packageInstance or the package instance was null on JVM side";
      return {};
    }

    jfloat headerHeight = env->CallFloatMethod(
        packageInstance, computeDummyLayoutID, fontSize, isTitleEmpty);

    return {headerHeight};
  }
#endif // ANDROID
};

} // namespace react
} // namespace facebook
