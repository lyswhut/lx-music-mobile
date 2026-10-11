#import <Foundation/Foundation.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTSurfaceTouchHandler.h>
#else
#import <React/RCTTouchHandler.h>
#endif // RCT_NEW_ARCH_ENABLED

#ifdef RCT_NEW_ARCH_ENABLED
#define RNS_TOUCH_HANDLER_ARCH_TYPE RCTSurfaceTouchHandler
#else
#define RNS_TOUCH_HANDLER_ARCH_TYPE RCTTouchHandler
#endif // RCT_NEW_ARCH_ENABLED

NS_ASSUME_NONNULL_BEGIN

@interface UIView (RNSUtility)

- (nullable RNS_TOUCH_HANDLER_ARCH_TYPE *)rnscreens_findTouchHandlerInAncestorChain;

@end

NS_ASSUME_NONNULL_END
