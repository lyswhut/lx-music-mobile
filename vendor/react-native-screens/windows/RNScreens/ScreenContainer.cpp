#include "pch.h"
#include "ScreenContainer.h"
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
ScreenContainer::ScreenContainer(
    winrt::Microsoft::ReactNative::IReactContext reactContext)
    : m_reactContext(reactContext),
      m_children(
          {winrt::single_threaded_vector<Windows::UI::Xaml::UIElement>()}) {}

void ScreenContainer::addScreen(Screen &screen, int64_t) {
  auto uiElement = screen.try_as<UIElement>();
  if (!uiElement)
    return;

  m_children.Append(uiElement);
  Content(uiElement);
}

void ScreenContainer::removeAllChildren() {
  Content(nullptr);
  m_children.Clear();
}

void ScreenContainer::removeChildAt(int64_t index) {
  m_children.RemoveAt(static_cast<uint32_t>(index));
}

void ScreenContainer::replaceChild(
    winrt::Windows::UI::Xaml::UIElement oldChild,
    winrt::Windows::UI::Xaml::UIElement newChild) {
  uint32_t index;
  if (!m_children.IndexOf(oldChild, index))
    return;

  m_children.SetAt(index, newChild);
}
} // namespace winrt::RNScreens::implementation
