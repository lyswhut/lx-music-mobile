#include "pch.h"
#include "ScreenStackViewManager.h"
#include "JSValueXaml.h"
#include "NativeModules.h"
#include "Screen.h"
#include "ScreenStack.h"

namespace winrt {
using namespace Microsoft::ReactNative;
using namespace Windows::Foundation;
using namespace Windows::Foundation::Collections;
using namespace Windows::UI;
using namespace Windows::UI::Xaml;
using namespace Windows::UI::Xaml::Controls;
} // namespace winrt

namespace winrt::RNScreens::implementation {
// IViewManager
winrt::hstring ScreenStackViewManager::Name() noexcept {
  return L"RNSScreenStack";
}

winrt::FrameworkElement ScreenStackViewManager::CreateView() noexcept {
  return winrt::make<ScreenStack>(m_reactContext);
}

// IViewManagerRequiresNativeLayout
bool ScreenStackViewManager::RequiresNativeLayout() {
  return false;
}

// IViewManagerWithChildren
void ScreenStackViewManager::AddView(
    FrameworkElement parent,
    UIElement child,
    int64_t index) {
  auto screenStack = parent.as<ScreenStack>();
  if (!screenStack)
    return;

  auto screen = child.as<Screen>();
  if (!screen)
    return;

  screenStack->addScreen(*screen, index);
}

void ScreenStackViewManager::RemoveAllChildren(FrameworkElement parent) {
  auto screenStack = parent.as<ScreenStack>();
  if (!screenStack)
    return;

  screenStack->removeAllChildren();
}

void ScreenStackViewManager::RemoveChildAt(
    FrameworkElement parent,
    int64_t index) {
  auto screenStack = parent.as<ScreenStack>();
  if (!screenStack)
    return;

  screenStack->removeChildAt(index);
}

void ScreenStackViewManager::ReplaceChild(
    FrameworkElement parent,
    UIElement oldChild,
    UIElement newChild) {
  auto screenStack = parent.as<ScreenStack>();
  if (!screenStack)
    return;

  screenStack->replaceChild(oldChild, newChild);
}

// IViewManagerWithReactContext
winrt::IReactContext ScreenStackViewManager::ReactContext() noexcept {
  return m_reactContext;
}

void ScreenStackViewManager::ReactContext(IReactContext reactContext) noexcept {
  m_reactContext = reactContext;
}

// IViewManagerWithNativeProperties
IMapView<hstring, ViewManagerPropertyType>
ScreenStackViewManager::NativeProps() noexcept {
  auto nativeProps =
      winrt::single_threaded_map<hstring, ViewManagerPropertyType>();
  return nativeProps.GetView();
}

void ScreenStackViewManager::UpdateProperties(
    FrameworkElement const &view,
    IJSValueReader const &propertyMapReader) noexcept {
  (void)view;
  const JSValueObject &propertyMap = JSValue::ReadObjectFrom(propertyMapReader);
  for (auto const &pair : propertyMap) {
    auto const &propertyName = pair.first;
    auto const &propertyValue = pair.second;
    (void)propertyName;
    (void)propertyValue;
  }
}

// IViewManagerWithExportedEventTypeConstants
ConstantProviderDelegate
ScreenStackViewManager::ExportedCustomBubblingEventTypeConstants() noexcept {
  return nullptr;
}

ConstantProviderDelegate
ScreenStackViewManager::ExportedCustomDirectEventTypeConstants() noexcept {
  return nullptr;
}

// IViewManagerWithCommands
IVectorView<hstring> ScreenStackViewManager::Commands() noexcept {
  auto commands = winrt::single_threaded_vector<hstring>();
  return commands.GetView();
}

void ScreenStackViewManager::DispatchCommand(
    FrameworkElement const &view,
    winrt::hstring const &commandId,
    winrt::IJSValueReader const &commandArgsReader) noexcept {
  (void)view;
  (void)commandId;
  (void)commandArgsReader;
}
} // namespace winrt::RNScreens::implementation
