#include "pch.h"
#include "RNScreens.h"
#include "JSValueXaml.h"
#include "RNScreensModule.g.cpp"

namespace winrt {
using namespace Microsoft::ReactNative;
using namespace Windows::Data::Json;
using namespace Windows::Foundation;
using namespace Windows::UI;
using namespace Windows::UI::Popups;
using namespace Windows::UI::Xaml;
using namespace Windows::UI::Xaml::Controls;
using namespace Windows::UI::Xaml::Input;
using namespace Windows::UI::Xaml::Media;
} // namespace winrt

namespace winrt::RNScreens::implementation {

RNScreensModule::RNScreensModule(winrt::IReactContext const &reactContext)
    : m_reactContext(reactContext) {}

winrt::Windows::Foundation::Collections::IMapView<
    winrt::hstring,
    winrt::Microsoft::ReactNative::ViewManagerPropertyType>
RNScreensModule::NativeProps() noexcept {
  auto nativeProps =
      winrt::single_threaded_map<hstring, ViewManagerPropertyType>();
  return nativeProps.GetView();
}

void RNScreensModule::UpdateProperties(
    winrt::Microsoft::ReactNative::IJSValueReader const
        &propertyMapReader) noexcept {
  const JSValueObject &propertyMap = JSValue::ReadObjectFrom(propertyMapReader);
  for (auto const &pair : propertyMap) {
    auto const &propertyName = pair.first;
    auto const &propertyValue = pair.second;
    (void)propertyName;
    (void)propertyValue;
  }
}

winrt::Microsoft::ReactNative::ConstantProviderDelegate
RNScreensModule::ExportedCustomBubblingEventTypeConstants() noexcept {
  return nullptr;
}

winrt::Microsoft::ReactNative::ConstantProviderDelegate
RNScreensModule::ExportedCustomDirectEventTypeConstants() noexcept {
  return nullptr;
}

winrt::Windows::Foundation::Collections::IVectorView<winrt::hstring>
RNScreensModule::Commands() noexcept {
  return nullptr;
}

void RNScreensModule::DispatchCommand(
    winrt::hstring const &commandId,
    winrt::Microsoft::ReactNative::IJSValueReader const
        &commandArgsReader) noexcept {
  (void)commandId;
  (void)commandArgsReader;
}
} // namespace winrt::RNScreens::implementation