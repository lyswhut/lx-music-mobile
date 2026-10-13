#include "RNSScreenShadowNode.h"

namespace facebook {
namespace react {

namespace yoga = facebook::yoga;
using namespace rnscreens;

extern const char RNSScreenComponentName[] = "RNSScreen";

Point RNSScreenShadowNode::getContentOriginOffset(
    bool /*includeTransform*/) const {
  auto stateData = getStateData();
  auto contentOffset = stateData.contentOffset;
  return {contentOffset.x, contentOffset.y};
}

void RNSScreenShadowNode::layout(facebook::react::LayoutContext layoutContext) {
  YogaLayoutableShadowNode::layout(layoutContext);

#ifdef ANDROID
  applyFrameCorrections();
#endif // ANDROID
}

#ifdef ANDROID
void RNSScreenShadowNode::applyFrameCorrections() {
  ensureUnsealed();

  // On the very first layout we want to correct both Y offset and frame size.
  // On consecutive layouts we want to correct only Y offset, as the frame size
  // is received from JVM side. This is done so if the Screen dimensions are
  // read from ShadowTree (e.g by reanimated) they have chance of being
  // accurate. On JVM side we do ignore this frame anyway, because
  // ScreenStackViewManager.needsCustomLayoutForChildren() == true.
  const auto &stateData = getStateData();
  const float lastKnownHeaderHeight = stateData.getLastKnownHeaderHeight();
  const auto &headerCorrectionModes = stateData.getHeaderCorrectionModes();
  layoutMetrics_.frame.origin.y += lastKnownHeaderHeight *
      headerCorrectionModes.check(
          FrameCorrectionModes::Mode::FrameOriginCorrection);
  layoutMetrics_.frame.size.height -= lastKnownHeaderHeight *
      headerCorrectionModes.check(
          FrameCorrectionModes::Mode::FrameHeightCorrection);
}

void RNSScreenShadowNode::setHeaderHeight(float headerHeight) {
  getStateDataMutable().setHeaderHeight(headerHeight);
}

FrameCorrectionModes &RNSScreenShadowNode::getFrameCorrectionModes() {
  return getStateDataMutable().getFrameCorrectionModes();
}

RNSScreenShadowNode::StateData &RNSScreenShadowNode::getStateDataMutable() {
  // We assume that this method is called to mutate the data, so we ensure
  // we're unsealed.
  ensureUnsealed();
  return const_cast<RNSScreenShadowNode::StateData &>(getStateData());
}

#endif // ANDROID

} // namespace react
} // namespace facebook
