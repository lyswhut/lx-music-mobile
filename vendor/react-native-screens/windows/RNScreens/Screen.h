#pragma once

namespace winrt::RNScreens::implementation {

enum class StackPresentation { PUSH, MODAL, TRANSPARENT_MODAL };

enum class StackAnimation {
  DEFAULT,
  NONE,
  FADE,
  SIMPLE_FROM_BOTTOM,
  SLIDE_FROM_RIGHT,
  SLIDE_FROM_LEFT,
  IOS
};

enum class ReplaceAnimation { PUSH, POP };

enum class ActivityState { INACTIVE, TRANSITIONING_OR_BELOW_TOP, ON_TOP };

enum class WindowTraits {
  ORIENTATION,
  COLOR,
  STYLE,
  TRANSLUCENT,
  HIDDEN,
  ANIMATED
};

class Screen : public winrt::Windows::UI::Xaml::Controls::StackPanelT<Screen> {
 public:
  Screen(winrt::Microsoft::ReactNative::IReactContext reactContext);
  ~Screen();

  void addView(winrt::Windows::UI::Xaml::UIElement element);
  void removeAllChildren();
  void removeChildAt(int64_t index);
  void replaceChild(
      winrt::Windows::UI::Xaml::UIElement oldChild,
      winrt::Windows::UI::Xaml::UIElement newChild);

  winrt::event_token onLoadingRevoker;
  void onLoading(
      winrt::Windows::UI::Xaml::FrameworkElement const &sender,
      winrt::Windows::Foundation::IInspectable const &args);

  winrt::event_token onLoadedRevoker;
  void onLoaded(
      winrt::Windows::Foundation::IInspectable const &sender,
      winrt::Windows::UI::Xaml::RoutedEventArgs const &args);

  winrt::event_token onUnloadedRevoker;
  void onUnloaded(
      winrt::Windows::Foundation::IInspectable const &sender,
      winrt::Windows::UI::Xaml::RoutedEventArgs const &args);

  void dispatchOnAppear();
  void dispatchOnDisappear();
  void dispatchOnWillAppear();
  void dispatchOnWillDisappear();

 private:
  winrt::Microsoft::ReactNative::IReactContext m_reactContext{nullptr};
};
} // namespace winrt::RNScreens::implementation
