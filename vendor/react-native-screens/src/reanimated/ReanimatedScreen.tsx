import React from 'react';
import { InnerScreen, ScreenProps } from 'react-native-screens';

// @ts-ignore file to be used only if `react-native-reanimated` available in the project
import Animated from 'react-native-reanimated';

const AnimatedScreen = Animated.createAnimatedComponent(
  InnerScreen as unknown as React.ComponentClass,
);

const ReanimatedScreen = React.forwardRef<typeof AnimatedScreen, ScreenProps>(
  (props, ref) => {
    return (
      <AnimatedScreen
        // @ts-ignore some problems with ref and onTransitionProgressReanimated being "fake" prop for parsing of `useEvent` return value
        ref={ref}
        {...props}
      />
    );
  },
);

ReanimatedScreen.displayName = 'ReanimatedScreen';

export default ReanimatedScreen;
