#include "RNSModalScreenShadowNode.h"

namespace facebook {
namespace react {

extern const char RNSModalScreenComponentName[] = "RNSModalScreen";

Point RNSModalScreenShadowNode::getContentOriginOffset(
    bool /*includeTransform*/) const {
  auto stateData = getStateData();
  auto contentOffset = stateData.contentOffset;
  return {contentOffset.x, contentOffset.y};
}

} // namespace react
} // namespace facebook
