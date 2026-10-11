#include "pch.h"
#include "ReactPackageProvider.h"
#if __has_include("ReactPackageProvider.g.cpp")
#include "ReactPackageProvider.g.cpp"
#endif

#include "ScreenContainerViewManager.h"
#include "ScreenStackHeaderConfigViewManager.h"
#include "ScreenStackViewManager.h"
#include "ScreenViewManager.h"

using namespace winrt::Microsoft::ReactNative;

namespace winrt::RNScreens::implementation {
void ReactPackageProvider::CreatePackage(
    IReactPackageBuilder const &packageBuilder) noexcept {
  packageBuilder.AddViewManager(L"RNScreensViewManager", []() {
    return winrt::make<ScreenViewManager>();
  });
  packageBuilder.AddViewManager(L"RNScreensStackHeaderConfigViewManager", []() {
    return winrt::make<ScreenStackHeaderConfigViewManager>();
  });
  packageBuilder.AddViewManager(L"RNSScreenStackViewManager", []() {
    return winrt::make<ScreenStackViewManager>();
  });
  packageBuilder.AddViewManager(L"RNSScreenContainerViewManager", []() {
    return winrt::make<ScreenContainerViewManager>();
  });
}
} // namespace winrt::RNScreens::implementation
