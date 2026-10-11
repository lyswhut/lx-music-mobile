
#import "UIView+RNSUtility.h"

#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTSurfaceView.h>
#endif

@implementation UIView (RNSUtility)

- (nullable RNS_TOUCH_HANDLER_ARCH_TYPE *)rnscreens_findTouchHandlerInAncestorChain
{
  UIView *parent = self.superview;

#ifdef RCT_NEW_ARCH_ENABLED
  // On Fabric there is no view that exposes touchHandler above us in the view hierarchy, however it is still
  // utilised. `RCTSurfaceView` should be present above us, which hosts `RCTFabricSurface` instance, which in turn
  // hosts `RCTSurfaceTouchHandler` as a private field. When initialised, `RCTSurfaceTouchHandler` is attached to the
  // surface view as a gestureRecognizer <- and this is where we can lay our hands on it.

  while (parent != nil && ![parent isKindOfClass:RCTSurfaceView.class]) {
    parent = parent.superview;
  }

  // This could be possible in modal context
  if (parent == nil) {
    return nil;
  }

  // Experimentation shows that RCTSurfaceTouchHandler is the only gestureRecognizer registered here,
  // so we should not be afraid of any performance hit here.
  for (UIGestureRecognizer *recognizer in parent.gestureRecognizers) {
    if ([recognizer isKindOfClass:RCTSurfaceTouchHandler.class]) {
      return static_cast<RNS_TOUCH_HANDLER_ARCH_TYPE *>(recognizer);
    }
  }

#else

  // On Paper we can access touchHandler hosted by `RCTRootContentView` which should be above ScreenStack
  // in view hierarchy.
  while (parent != nil && ![parent respondsToSelector:@selector(touchHandler)]) {
    parent = parent.superview;
  }

  if (parent != nil) {
    RCTTouchHandler *touchHandler = [parent performSelector:@selector(touchHandler)];
    return static_cast<RNS_TOUCH_HANDLER_ARCH_TYPE *>(touchHandler);
  }

#endif // RCT_NEW_ARCH_ENABLED

  return nil;
}

@end
