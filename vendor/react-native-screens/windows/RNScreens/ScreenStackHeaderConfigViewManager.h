#pragma once
#include "NativeModules.h"
#include "winrt/Microsoft.ReactNative.h"

namespace winrt::RNScreens::implementation {

class ScreenStackHeaderConfigViewManager
    : public winrt::implements<
          ScreenStackHeaderConfigViewManager,
          winrt::Microsoft::ReactNative::IViewManager,
          winrt::Microsoft::ReactNative::IViewManagerRequiresNativeLayout,
          winrt::Microsoft::ReactNative::IViewManagerWithReactContext,
          winrt::Microsoft::ReactNative::IViewManagerWithNativeProperties,
          winrt::Microsoft::ReactNative::
              IViewManagerWithExportedEventTypeConstants,
          winrt::Microsoft::ReactNative::IViewManagerWithCommands> {
 public:
  ScreenStackHeaderConfigViewManager() = default;

  // IViewManager
  winrt::hstring Name() noexcept;
  winrt::Windows::UI::Xaml::FrameworkElement CreateView() noexcept;

  // IViewManagerRequiresNativeLayout
  bool RequiresNativeLayout();

  // IViewManagerWithReactContext
  winrt::Microsoft::ReactNative::IReactContext ReactContext() noexcept;
  void ReactContext(
      winrt::Microsoft::ReactNative::IReactContext reactContext) noexcept;

  // IViewManagerWithNativeProperties
  winrt::Windows::Foundation::Collections::IMapView<
      winrt::hstring,
      winrt::Microsoft::ReactNative::ViewManagerPropertyType>
  NativeProps() noexcept;

  void UpdateProperties(
      winrt::Windows::UI::Xaml::FrameworkElement const &view,
      winrt::Microsoft::ReactNative::IJSValueReader const
          &propertyMapReader) noexcept;

  // IViewManagerWithExportedEventTypeConstants
  winrt::Microsoft::ReactNative::ConstantProviderDelegate
  ExportedCustomBubblingEventTypeConstants() noexcept;
  winrt::Microsoft::ReactNative::ConstantProviderDelegate
  ExportedCustomDirectEventTypeConstants() noexcept;

  // IViewManagerWithCommands
  winrt::Windows::Foundation::Collections::IVectorView<winrt::hstring>
  Commands() noexcept;

  void DispatchCommand(
      winrt::Windows::UI::Xaml::FrameworkElement const &view,
      winrt::hstring const &commandId,
      winrt::Microsoft::ReactNative::IJSValueReader const
          &commandArgsReader) noexcept;

 private:
  winrt::Microsoft::ReactNative::IReactContext m_reactContext{nullptr};
};
} // namespace winrt::RNScreens::implementation
