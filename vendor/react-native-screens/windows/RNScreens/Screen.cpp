#include "pch.h"
#include "Screen.h"
#include "JSValueXaml.h"
#include "NativeModules.h"


namespace winrt {
using namespace Microsoft::ReactNative;
using namespace Windows::Foundation;
using namespace Windows::Foundation::Collections;
using namespace Windows::UI;
using namespace Windows::UI::Xaml;
using namespace Windows::UI::Xaml::Controls;
} // namespace winrt

namespace winrt::RNScreens::implementation {
Screen::Screen(winrt::Microsoft::ReactNative::IReactContext reactContext)
    : m_reactContext(reactContext) {
  onLoadingRevoker = Loading({this, &Screen::onLoading});
  onLoadedRevoker = Loaded({this, &Screen::onLoaded});
  onUnloadedRevoker = Unloaded({this, &Screen::onUnloaded});
}

Screen::~Screen() {
  Loading(onLoadingRevoker);
  Loaded(onLoadedRevoker);
  Unloaded(onUnloadedRevoker);
}

void Screen::addView(winrt::Windows::UI::Xaml::UIElement element) {
  Children().Append(element);
}

void Screen::removeAllChildren() {
  Children().Clear();
}

void Screen::removeChildAt(int64_t index) {
  Children().RemoveAt(static_cast<uint32_t>(index));
}

void Screen::replaceChild(
    winrt::Windows::UI::Xaml::UIElement oldChild,
    winrt::Windows::UI::Xaml::UIElement newChild) {
  uint32_t index;
  if (!Children().IndexOf(oldChild, index))
    return;

  Children().SetAt(index, newChild);
}

void Screen::onLoading(
    winrt::Windows::UI::Xaml::FrameworkElement const &sender,
    winrt::Windows::Foundation::IInspectable const &) {
  auto screen = sender.try_as<Screen>();
  if (!screen)
    return;

  screen->dispatchOnWillAppear();
}

void Screen::onLoaded(
    winrt::Windows::Foundation::IInspectable const &sender,
    winrt::Windows::UI::Xaml::RoutedEventArgs const &) {
  auto screen = sender.try_as<Screen>();
  if (!screen)
    return;

  screen->dispatchOnAppear();
}

void Screen::onUnloaded(
    winrt::Windows::Foundation::IInspectable const &sender,
    winrt::Windows::UI::Xaml::RoutedEventArgs const &) {
  auto screen = sender.try_as<Screen>();
  if (!screen)
    return;

  screen->dispatchOnWillDisappear();
  screen->dispatchOnDisappear();
}

void Screen::dispatchOnWillAppear() {
  m_reactContext.DispatchEvent(
      *this,
      L"topWillAppear",
      [&](winrt::IJSValueWriter const &eventDataWriter) noexcept {
        eventDataWriter.WriteObjectBegin();
        eventDataWriter.WriteObjectEnd();
      });
}

void Screen::dispatchOnWillDisappear() {
  m_reactContext.DispatchEvent(
      *this,
      L"topWillDisappear",
      [&](winrt::IJSValueWriter const &eventDataWriter) noexcept {
        eventDataWriter.WriteObjectBegin();
        eventDataWriter.WriteObjectEnd();
      });
}

void Screen::dispatchOnAppear() {
  m_reactContext.DispatchEvent(
      *this,
      L"topAppear",
      [&](winrt::IJSValueWriter const &eventDataWriter) noexcept {
        eventDataWriter.WriteObjectBegin();
        eventDataWriter.WriteObjectEnd();
      });
}

void Screen::dispatchOnDisappear() {
  m_reactContext.DispatchEvent(
      *this,
      L"topDisappear",
      [&](winrt::IJSValueWriter const &eventDataWriter) noexcept {
        eventDataWriter.WriteObjectBegin();
        eventDataWriter.WriteObjectEnd();
      });
}
} // namespace winrt::RNScreens::implementation
