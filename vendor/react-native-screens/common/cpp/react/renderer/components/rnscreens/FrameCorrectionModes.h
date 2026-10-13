#pragma once

#include <cstdint>

namespace rnscreens {

/**
 * Flags describing types of corrections to apply to Screen frame
 * after layout process.
 */
class FrameCorrectionModes final {
 public:
  enum Mode : std::uint8_t {
    /**
     * No correction should be applied to layout metrics of Screen
     */
    None = 0,

    /**
     * Screen's frame height should be corrected
     */
    FrameHeightCorrection = 1 << 0,

    /**
     * Screen's frame origin should be corrected
     */
    FrameOriginCorrection = 1 << 1,
  };

  inline void set(Mode mode) {
    modes_ = Mode(modes_ | mode);
  }

  inline void unset(Mode mode) {
    modes_ = Mode(modes_ & ~mode);
  }

  // Check whether current set of flags contains all flags set in argument.
  inline bool check(Mode mode) const {
    return Mode(modes_ & mode) == mode;
  }

  inline Mode getAll() const {
    return modes_;
  }

 private:
  Mode modes_{Mode::None};
};

} // namespace rnscreens
