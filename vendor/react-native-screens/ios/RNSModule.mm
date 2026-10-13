#import "RNSModule.h"
#import <React/RCTBridge+Private.h>
#import <React/RCTBridge.h>
#import <React/RCTUIManager.h>
#import <React/RCTUIManagerUtils.h>
#import <React/RCTUtils.h>
#include <jsi/jsi.h>
#import "RNSScreenStack.h"
#import "RNScreensTurboModule.h"

NS_ASSUME_NONNULL_BEGIN

@implementation RNSModule {
  std::atomic<bool> isActiveTransition;
}

RCT_EXPORT_MODULE()

#ifdef RCT_NEW_ARCH_ENABLED
@synthesize viewRegistry_DEPRECATED = _viewRegistry_DEPRECATED;
#endif // RCT_NEW_ARCH_ENABLED
@synthesize bridge = _bridge;

- (dispatch_queue_t)methodQueue
{
  // It seems that due to how UIBlocks work with uiManager, we need to call the methods there
  // for the blocks to be dispatched before the batch is completed
  return dispatch_get_main_queue();
}

- (NSDictionary *)constantsToExport
{
  [self installHostObject];
  return @{};
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (RNSScreenStackView *)getScreenStackView:(NSNumber *)reactTag
{
  RCTAssertMainQueue();
  RNSScreenStackView *view;
#ifdef RCT_NEW_ARCH_ENABLED
  view = (RNSScreenStackView *)[self.viewRegistry_DEPRECATED viewForReactTag:reactTag];
#else
  view = (RNSScreenStackView *)[self.bridge.uiManager viewForReactTag:reactTag];
#endif // RCT_NEW_ARCH_ENABLED
  return view;
}

- (NSArray<NSNumber *> *)startTransition:(NSNumber *)stackTag
{
  RCTAssertMainQueue();
  RNSScreenStackView *stackView = [self getStackView:stackTag];
  if (stackView == nil || isActiveTransition) {
    return @[ @(-1), @(-1) ];
  }
  NSArray<NSNumber *> *screenTags = @[ @(-1), @(-1) ];
  auto screens = stackView.reactViewController.childViewControllers;
  unsigned long screenCount = [screens count];
  if (screenCount > 1) {
    UIView *topScreen = screens[screenCount - 1].view;
    UIView *belowTopScreen = screens[screenCount - 2].view;
    belowTopScreen.transform = CGAffineTransformMake(1, 0, 0, 1, 0, 0);
    isActiveTransition = true;
#ifdef RCT_NEW_ARCH_ENABLED
    screenTags = @[ @(topScreen.tag), @(belowTopScreen.tag) ];
#else
    screenTags = @[ topScreen.reactTag, belowTopScreen.reactTag ];
#endif // RCT_NEW_ARCH_ENABLED
    [stackView startScreenTransition];
  }
  return screenTags;
}

- (bool)updateTransition:(NSNumber *)stackTag progress:(double)progress
{
  RCTAssertMainQueue();
  RNSScreenStackView *stackView = [self getStackView:stackTag];
  if (stackView == nil || !isActiveTransition) {
    return false;
  }
  [stackView updateScreenTransition:progress];
  return true;
}

- (bool)finishTransition:(NSNumber *)stackTag canceled:(bool)canceled
{
  RCTAssertMainQueue();
  RNSScreenStackView *stackView = [self getStackView:stackTag];
  if (stackView == nil || !isActiveTransition) {
    return false;
  }
  [stackView finishScreenTransition:canceled];
  if (!canceled) {
    stackView.disableSwipeBack = NO;
  }
  isActiveTransition = false;
  return true;
}

- (void)disableSwipeBackForTopScreen:(NSNumber *)stackTag
{
  RCTAssertMainQueue();
  RNSScreenStackView *stackView = [self getStackView:stackTag];
  if (stackView == nil) {
    return;
  }
  stackView.disableSwipeBack = YES;
}

- (RNSScreenStackView *)getStackView:(NSNumber *)stackTag
{
  RNSScreenStackView *view = [self getScreenStackView:stackTag];
  if (view != nil && ![view isKindOfClass:[RNSScreenStackView class]]) {
    RCTLogError(@"[RNScreens] Invalid view type, expecting RNSScreenStackView, got: %@", view);
    return nil;
  }
  return view;
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  [self installHostObject];
  return std::make_shared<facebook::react::NativeScreensModuleSpecJSI>(params);
}
#endif

- (void)installHostObject
{
  /*
   installHostObject method is called from constantsToExport and getTurboModule,
   because depending on the selected architecture, only one method will be called.
   For `Paper`, it will be constantsToExport, and for `Fabric`, it will be getTurboModule.
*/
  RCTCxxBridge *cxxBridge = (RCTCxxBridge *)self.bridge;
  if (cxxBridge != nil) {
    auto jsiRuntime = (jsi::Runtime *)cxxBridge.runtime;
    if (jsiRuntime != nil) {
      auto &runtime = *jsiRuntime;
      __weak auto weakSelf = self;

      const auto &startTransition = [weakSelf](int stackTag) -> std::array<int, 2> {
        auto screensTags = [weakSelf startTransition:@(stackTag)];
        return {[screensTags[0] intValue], [screensTags[1] intValue]};
      };
      const auto &updateTransition = [weakSelf](int stackTag, double progress) {
        [weakSelf updateTransition:@(stackTag) progress:progress];
      };
      const auto &finishTransition = [weakSelf](int stackTag, bool canceled) {
        [weakSelf finishTransition:@(stackTag) canceled:canceled];
      };
      const auto &disableSwipeBackForTopScreen = [weakSelf](int stackTag) {
        [weakSelf disableSwipeBackForTopScreen:@(stackTag)];
      };

      auto rnScreensModule = std::make_shared<RNScreens::RNScreensTurboModule>(
          startTransition, updateTransition, finishTransition, disableSwipeBackForTopScreen);
      auto rnScreensModuleHostObject = jsi::Object::createFromHostObject(runtime, rnScreensModule);
      runtime.global().setProperty(
          runtime, RNScreens::RNScreensTurboModule::MODULE_NAME, std::move(rnScreensModuleHostObject));
    }
  }
}

@end

NS_ASSUME_NONNULL_END
