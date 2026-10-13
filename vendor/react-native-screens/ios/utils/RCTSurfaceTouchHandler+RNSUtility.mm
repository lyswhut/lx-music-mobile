#ifdef RCT_NEW_ARCH_ENABLED
#import "RCTSurfaceTouchHandler+RNSUtility.h"

@implementation RCTSurfaceTouchHandler (RNSUtility)

- (void)rnscreens_cancelTouches
{
  [self setEnabled:NO];
  [self setEnabled:YES];
  [self reset];
}

@end
#endif // RCT_NEW_ARCH_ENABLED
