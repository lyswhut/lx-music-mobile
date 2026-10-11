#include <jsi/jsi.h>
#include <array>

#define JSI_HOST_FUNCTION(NAME)    \
  jsi::Value NAME(                 \
      jsi::Runtime &rt,            \
      const jsi::Value &thisValue, \
      const jsi::Value *arguments, \
      size_t count)

using namespace facebook;

namespace RNScreens {

class RNScreensTurboModule : public jsi::HostObject {
  static std::function<std::array<int, 2>(int)> startTransition_;
  static std::function<void(int, double)> updateTransition_;
  static std::function<void(int, bool)> finishTransition_;
  static std::function<void(int)> disableSwipeBackForTopScreen_;

 public:
  static const char MODULE_NAME[];

  RNScreensTurboModule(
      std::function<std::array<int, 2>(int)> startTransition,
      std::function<void(int, double)> updateTransition,
      std::function<void(int, bool)> finishTransition,
      std::function<void(int)> disableSwipeBackForTopScreen);
  ~RNScreensTurboModule() override;
  jsi::Value get(jsi::Runtime &rt, const jsi::PropNameID &name) override;
  void set(jsi::Runtime &, const jsi::PropNameID &, const jsi::Value &)
      override;
  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime &rt) override;
  static JSI_HOST_FUNCTION(startTransition);
  static JSI_HOST_FUNCTION(updateTransition);
  static JSI_HOST_FUNCTION(finishTransition);
  static JSI_HOST_FUNCTION(disableSwipeBackForTopScreen);
};

} // namespace RNScreens
