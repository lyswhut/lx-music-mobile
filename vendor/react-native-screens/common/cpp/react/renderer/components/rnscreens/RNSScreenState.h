#pragma once

#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/graphics/Float.h>

#ifdef ANDROID
#include <folly/dynamic.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>
#endif

#include "FrameCorrectionModes.h"

namespace facebook {
namespace react {

using namespace rnscreens;

class JSI_EXPORT RNSScreenState final {
 public:
  using Shared = std::shared_ptr<const RNSScreenState>;

  RNSScreenState(){};
  RNSScreenState(Size frameSize_, Point contentOffset_)
      : frameSize(frameSize_), contentOffset(contentOffset_){};

#ifdef ANDROID
  RNSScreenState(RNSScreenState const &previousState, folly::dynamic data)
      : frameSize(Size{
            (Float)data["frameWidth"].getDouble(),
            (Float)data["frameHeight"].getDouble()}),
        contentOffset(Point{
            (Float)data["contentOffsetX"].getDouble(),
            (Float)data["contentOffsetY"].getDouble()}),
        lastKnownHeaderHeight_{previousState.lastKnownHeaderHeight_},
        headerCorrectionModes_{previousState.headerCorrectionModes_} {};
#endif

  const Size frameSize{};
  Point contentOffset;

#ifdef ANDROID
  folly::dynamic getDynamic() const;
  MapBuffer getMapBuffer() const {
    return MapBufferBuilder::EMPTY();
  };

  void setHeaderHeight(float headerHeight);

  float getLastKnownHeaderHeight() const noexcept;

  FrameCorrectionModes &getFrameCorrectionModes() noexcept;

  const FrameCorrectionModes &getHeaderCorrectionModes() const noexcept;

#endif

 private:
#ifdef ANDROID
  // Header height as measured on dummy layout
  float lastKnownHeaderHeight_{0.f};

  FrameCorrectionModes headerCorrectionModes_{};
#endif // ANDROID

#pragma mark - Getters
};

} // namespace react
} // namespace facebook
