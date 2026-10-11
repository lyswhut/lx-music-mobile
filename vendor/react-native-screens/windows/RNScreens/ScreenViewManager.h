#pragma once

#include "NativeModules.h"
#include "winrt/Microsoft.ReactNative.h"

namespace winrt::RNScreens::implementation {

class ScreenViewManager
    : public winrt::implements<
          ScreenViewManager,
          winrt::Microsoft::ReactNative::IViewManager,
          winrt::Microsoft::ReactNative::IViewManagerRequiresNativeLayout,
          winrt::Microsoft::ReactNative::IViewManagerWithChildren,
          winrt::Microsoft::ReactNative::IViewManagerWithReactContext,
          winrt::Microsoft::ReactNative::IViewManagerWithNativeProperties,
          winrt::Microsoft::ReactNative::
              IViewManagerWithExportedEventTypeConstants,
          winrt::Microsoft::ReactNative::IViewManagerWithCommands> {
 public:
  ScreenViewManager() = default;

  // IViewManager
  winrt::hstring Name() noexcept;
  winrt::Windows::UI::Xaml::FrameworkElement CreateView() noexcept;

  // IViewManagerRequiresNativeLayout
  bool RequiresNativeLayout();

  // IViewManagerWithChildren
  void AddView(
      winrt::Windows::UI::Xaml::FrameworkElement parent,
      winrt::Windows::UI::Xaml::UIElement child,
      int64_t index);
  void RemoveAllChildren(winrt::Windows::UI::Xaml::FrameworkElement parent);
  void RemoveChildAt(
      winrt::Windows::UI::Xaml::FrameworkElement parent,
      int64_t index);
  void ReplaceChild(
      winrt::Windows::UI::Xaml::FrameworkElement parent,
      winrt::Windows::UI::Xaml::UIElement oldChild,
      winrt::Windows::UI::Xaml::UIElement newChild);

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
