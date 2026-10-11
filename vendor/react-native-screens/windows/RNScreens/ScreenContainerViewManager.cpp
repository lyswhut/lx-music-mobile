#include "pch.h"
#include "ScreenContainerViewManager.h"
#include "JSValueXaml.h"
#include "NativeModules.h"
#include "Screen.h"
#include "ScreenContainer.h"

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
winrt::hstring ScreenContainerViewManager::Name() noexcept {
  return L"RNSScreenContainer";
}

winrt::FrameworkElement ScreenContainerViewManager::CreateView() noexcept {
  return winrt::make<ScreenContainer>(m_reactContext);
}

// IViewManagerRequiresNativeLayout
bool ScreenContainerViewManager::RequiresNativeLayout() {
  return false;
}

// IViewManagerWithChildren
void ScreenContainerViewManager::AddView(
    FrameworkElement parent,
    UIElement child,
    int64_t index) {
  auto screenContainer = parent.as<ScreenContainer>();
  if (!screenContainer)
    return;

  auto screen = child.as<Screen>();
  if (!screen)
    return;

  screenContainer->addScreen(*screen, index);
}

void ScreenContainerViewManager::RemoveAllChildren(FrameworkElement parent) {
  auto screenContainer = parent.as<ScreenContainer>();
  if (!screenContainer)
    return;

  screenContainer->removeAllChildren();
}

void ScreenContainerViewManager::RemoveChildAt(
    FrameworkElement parent,
    int64_t index) {
  auto screenContainer = parent.as<ScreenContainer>();
  if (!screenContainer)
    return;

  screenContainer->removeChildAt(index);
}

void ScreenContainerViewManager::ReplaceChild(
    FrameworkElement parent,
    UIElement oldChild,
    UIElement newChild) {
  auto screenContainer = parent.as<ScreenContainer>();
  if (!screenContainer)
    return;

  screenContainer->replaceChild(oldChild, newChild);
}

// IViewManagerWithReactContext
winrt::IReactContext ScreenContainerViewManager::ReactContext() noexcept {
  return m_reactContext;
}

void ScreenContainerViewManager::ReactContext(
    IReactContext reactContext) noexcept {
  m_reactContext = reactContext;
}

// IViewManagerWithNativeProperties
IMapView<hstring, ViewManagerPropertyType>
ScreenContainerViewManager::NativeProps() noexcept {
  auto nativeProps =
      winrt::single_threaded_map<hstring, ViewManagerPropertyType>();
  return nativeProps.GetView();
}

void ScreenContainerViewManager::UpdateProperties(
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
ConstantProviderDelegate ScreenContainerViewManager::
    ExportedCustomBubblingEventTypeConstants() noexcept {
  return nullptr;
}

ConstantProviderDelegate
ScreenContainerViewManager::ExportedCustomDirectEventTypeConstants() noexcept {
  return nullptr;
}

// IViewManagerWithCommands
IVectorView<hstring> ScreenContainerViewManager::Commands() noexcept {
  auto commands = winrt::single_threaded_vector<hstring>();
  return commands.GetView();
}

void ScreenContainerViewManager::DispatchCommand(
    FrameworkElement const &view,
    winrt::hstring const &commandId,
    winrt::IJSValueReader const &commandArgsReader) noexcept {
  (void)view;
  (void)commandId;
  (void)commandArgsReader;
}
} // namespace winrt::RNScreens::implementation
