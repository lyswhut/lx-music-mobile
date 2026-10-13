import * as React from 'react';
// @ts-ignore file to be used only if `react-native-reanimated` available in the project
import Animated from 'react-native-reanimated';

type ReanimatedTransitionProgressContextBody = {
  progress: Animated.SharedValue<number>;
  closing: Animated.SharedValue<number>;
  goingForward: Animated.SharedValue<number>;
};

export default React.createContext<
  ReanimatedTransitionProgressContextBody | undefined
>(undefined);
