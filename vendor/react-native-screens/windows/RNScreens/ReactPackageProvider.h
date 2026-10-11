#pragma once
#include "ReactPackageProvider.g.h"

using namespace winrt::Microsoft::ReactNative;

namespace winrt::RNScreens::implementation {
struct ReactPackageProvider : ReactPackageProviderT<ReactPackageProvider> {
  ReactPackageProvider() = default;
  void CreatePackage(IReactPackageBuilder const &packageBuilder) noexcept;
};
} // namespace winrt::RNScreens::implementation

namespace winrt::RNScreens::factory_implementation {
struct ReactPackageProvider : ReactPackageProviderT<
                                  ReactPackageProvider,
                                  implementation::ReactPackageProvider> {};
} // namespace winrt::RNScreens::factory_implementation
