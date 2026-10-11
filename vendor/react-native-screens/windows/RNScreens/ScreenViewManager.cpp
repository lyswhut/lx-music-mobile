#include "pch.h"
#include "ScreenViewManager.h"
#include "JSValueXaml.h"
#include "NativeModules.h"
#include "Screen.h"

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
winrt::hstring ScreenViewManager::Name() noexcept {
  return L"RNSScreen";
}

winrt::FrameworkElement ScreenViewManager::CreateView() noexcept {
  return winrt::make<winrt::RNScreens::implementation::Screen>(m_reactContext);
}

// IViewManagerRequiresNativeLayout
bool ScreenViewManager::RequiresNativeLayout() {
  return false;
}

// IViewManagerWithChildren
void ScreenViewManager::AddView(
    FrameworkElement parent,
    UIElement child,
    int64_t index) {
  (void)index;
  auto screen = parent.try_as<Screen>();
  if (!screen)
    return;

  screen->addView(child);
}

void ScreenViewManager::RemoveAllChildren(FrameworkElement parent) {
  auto screen = parent.try_as<Screen>();
  if (!screen)
    return;

  screen->removeAllChildren();
}

void ScreenViewManager::RemoveChildAt(FrameworkElement parent, int64_t index) {
  auto screen = parent.try_as<Screen>();
  if (!screen)
    return;

  screen->removeChildAt(index);
}

void ScreenViewManager::ReplaceChild(
    FrameworkElement parent,
    UIElement oldChild,
    UIElement newChild) {
  auto screen = parent.try_as<Screen>();
  if (!screen)
    return;

  screen->replaceChild(oldChild, newChild);
}

// IViewManagerWithReactContext
winrt::IReactContext ScreenViewManager::ReactContext() noexcept {
  return m_reactContext;
}

void ScreenViewManager::ReactContext(IReactContext reactContext) noexcept {
  m_reactContext = reactContext;
}

// IViewManagerWithNativeProperties
IMapView<hstring, ViewManagerPropertyType>
ScreenViewManager::NativeProps() noexcept {
  auto nativeProps =
      winrt::single_threaded_map<hstring, ViewManagerPropertyType>();
  nativeProps.Insert(L"stackPresentation", ViewManagerPropertyType::String);
  nativeProps.Insert(L"stackAnimation", ViewManagerPropertyType::String);
  nativeProps.Insert(L"gestureEnabled", ViewManagerPropertyType::Boolean);
  nativeProps.Insert(L"replaceAnimation", ViewManagerPropertyType::String);
  nativeProps.Insert(L"screenOrientation", ViewManagerPropertyType::String);
  nativeProps.Insert(L"statusBarAnimation", ViewManagerPropertyType::String);
  nativeProps.Insert(L"statusBarColor", ViewManagerPropertyType::Number);
  nativeProps.Insert(L"statusBarStyle", ViewManagerPropertyType::String);
  nativeProps.Insert(L"statusBarTranslucent", ViewManagerPropertyType::Boolean);
  nativeProps.Insert(L"statusBarHidden", ViewManagerPropertyType::Boolean);
  return nativeProps.GetView();
}

void ScreenViewManager::UpdateProperties(
    FrameworkElement const &view,
    IJSValueReader const &propertyMapReader) noexcept {
  (void)view;
  const JSValueObject &propertyMap = JSValue::ReadObjectFrom(propertyMapReader);
  for (auto const &pair : propertyMap) {
    auto const &propertyName = pair.first;
    auto const &propertyValue = pair.second;
    if (propertyValue != nullptr) {
      if (propertyName == "replaceAnimation") {
        auto const &value = propertyValue.AsString();
        // TODO: Implement this for Windows
        (void)value;
      } else if (propertyName == "stackPresentation") {
        auto const &value = propertyValue.AsString();
        // TODO: Implement this for Windows
        (void)value;
      } else {
        OutputDebugStringA("Unknown property in ScreenViewManager\n");
      }
    }
  }
}

// IViewManagerWithExportedEventTypeConstants
ConstantProviderDelegate
ScreenViewManager::ExportedCustomBubblingEventTypeConstants() noexcept {
  return nullptr;
}

ConstantProviderDelegate
ScreenViewManager::ExportedCustomDirectEventTypeConstants() noexcept {
  return [](winrt::IJSValueWriter const &constantWriter) {
    WriteCustomDirectEventTypeConstant(constantWriter, "WillAppear");
    WriteCustomDirectEventTypeConstant(constantWriter, "WillDisappear");
    WriteCustomDirectEventTypeConstant(constantWriter, "Appear");
    WriteCustomDirectEventTypeConstant(constantWriter, "Disappear");
    WriteCustomDirectEventTypeConstant(constantWriter, "Dismissed");
    WriteCustomDirectEventTypeConstant(constantWriter, "FinishTransitioning");
  };
}

// IViewManagerWithCommands
IVectorView<hstring> ScreenViewManager::Commands() noexcept {
  auto commands = winrt::single_threaded_vector<hstring>();
  return commands.GetView();
}

void ScreenViewManager::DispatchCommand(
    FrameworkElement const &view,
    winrt::hstring const &commandId,
    winrt::IJSValueReader const &commandArgsReader) noexcept {
  (void)view;
  (void)commandId;
  (void)commandArgsReader;
}
} // namespace winrt::RNScreens::implementation
