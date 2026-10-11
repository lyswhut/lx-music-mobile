#ifndef RCT_NEW_ARCH_ENABLED
#import "RCTTouchHandler+RNSUtility.h"

@implementation RCTTouchHandler (RNSUtility)

- (void)rnscreens_cancelTouches
{
  [self setEnabled:NO];
  [self setEnabled:YES];
  [self reset];
}

@end

#endif // !RCT_NEW_ARCH_ENABLED
