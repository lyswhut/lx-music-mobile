#pragma once

namespace winrt::RNScreens::implementation {
class ScreenStackHeaderConfig
    : public winrt::Windows::UI::Xaml::Controls::StackPanelT<
          ScreenStackHeaderConfig> {
 public:
  ScreenStackHeaderConfig(
      winrt::Microsoft::ReactNative::IReactContext m_reactContext);

 private:
  winrt::Microsoft::ReactNative::IReactContext m_reactContext{nullptr};
};
} // namespace winrt::RNScreens::implementation
