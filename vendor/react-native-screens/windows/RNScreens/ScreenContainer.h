#pragma once
#include "Screen.h"

namespace winrt::RNScreens::implementation {
class ScreenContainer
    : public winrt::Windows::UI::Xaml::Controls::ContentControlT<
          ScreenContainer> {
 public:
  ScreenContainer(winrt::Microsoft::ReactNative::IReactContext reactContext);
  void addScreen(Screen &screen, int64_t index);
  void removeAllChildren();
  void removeChildAt(int64_t index);
  void replaceChild(
      winrt::Windows::UI::Xaml::UIElement oldChild,
      winrt::Windows::UI::Xaml::UIElement newChild);

  winrt::Windows::Foundation::Collections::IVector<Windows::UI::Xaml::UIElement>
      m_children;

 private:
  winrt::Microsoft::ReactNative::IReactContext m_reactContext{nullptr};
};
} // namespace winrt::RNScreens::implementation
