#include "pch.h"
#include "ScreenStack.h"
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
ScreenStack::ScreenStack(
    winrt::Microsoft::ReactNative::IReactContext reactContext)
    : m_reactContext(reactContext),
      m_children(
          {winrt::single_threaded_vector<Windows::UI::Xaml::UIElement>()}) {}

void ScreenStack::addScreen(Screen &screen, int64_t) {
  auto uiElement = screen.try_as<UIElement>();
  if (!uiElement)
    return;

  m_children.Append(uiElement);
  Content(uiElement);
}

void ScreenStack::removeAllChildren() {
  Content(nullptr);
  m_children.Clear();
}

void ScreenStack::removeChildAt(int64_t index) {
  m_children.RemoveAt(static_cast<uint32_t>(index));
  onChildModified(index);
}

void ScreenStack::replaceChild(
    winrt::Windows::UI::Xaml::UIElement oldChild,
    winrt::Windows::UI::Xaml::UIElement newChild) {
  uint32_t index;
  if (!m_children.IndexOf(oldChild, index))
    return;

  m_children.SetAt(index, newChild);
  onChildModified(index);
}

void ScreenStack::onChildModified(int64_t index) {
  // Was it the topmost item in the stack?
  if (index >= m_children.Size() - 1) {
    if (m_children.Size() == 0) {
      // Nobody left
      Content(nullptr);
    } else {
      // Focus on the top item
      auto uiElement = m_children.GetAt(m_children.Size() - 1);
      Content(uiElement);
    }
  }
}
} // namespace winrt::RNScreens::implementation
