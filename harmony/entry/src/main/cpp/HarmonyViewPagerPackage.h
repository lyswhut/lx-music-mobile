#pragma once

#include "ViewPagerPackage.h"

namespace rnoh {

class HarmonyViewPagerComponentInstance : public ViewPagerComponentInstance {
 public:
  explicit HarmonyViewPagerComponentInstance(ComponentInstance::Context context)
      : ViewPagerComponentInstance(std::move(context)) {}

  std::vector<TouchTarget::Shared> getTouchTargetChildren() override {
    const auto attribute = NativeNodeApi::getInstance()->getAttribute(
        getLocalRootArkUINode().getArkUINodeHandle(), NODE_SWIPER_INDEX);
    const auto children = getChildren();
    if (!attribute || !attribute->value || attribute->size < 1) return {};
    const auto pageIndex = attribute->value[0].i32;
    if (pageIndex < 0 || static_cast<std::size_t>(pageIndex) >= children.size()) return {};
    return {children[pageIndex]};
  }
};

class HarmonyViewPagerPackage : public ViewPagerPackage {
 public:
  explicit HarmonyViewPagerPackage(Package::Context context) : ViewPagerPackage(context) {}

  ComponentInstance::Shared createComponentInstance(const ComponentInstance::Context& context) override {
    if (context.componentName == "RNCViewPager") {
      return std::make_shared<HarmonyViewPagerComponentInstance>(context);
    }
    return nullptr;
  }
};

}
