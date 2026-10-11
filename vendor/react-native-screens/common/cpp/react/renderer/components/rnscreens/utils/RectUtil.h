#pragma once

#include <react/renderer/graphics/Float.h>
#include <react/renderer/graphics/Size.h>
#include <cmath>
#include <concepts>

namespace rnscreens {

namespace react = facebook::react;

template <typename T>
  requires std::is_floating_point_v<T>
inline constexpr bool equalWithRespectToEps(const T a, const T b, const T eps) {
  return std::abs(a - b) <= eps;
}

/**
 * Compares given two frame sizes with respect to the epsilon.
 *
 * @param first first frame size
 * @param second second frame size
 * @param eps comparison precision, defaults to 0.01, which should ensure that
 * precision of comparison is under 1px
 * @return whether the frame dimensions are the same with respect to given
 * epsilon
 */
inline constexpr bool checkFrameSizesEqualWithEps(
    const react::Size &first,
    const react::Size &second,
    const react::Float eps = 0.01) {
  return equalWithRespectToEps(first.width, second.width, eps) &&
      equalWithRespectToEps(first.height, second.height, eps);
}

} // namespace rnscreens
