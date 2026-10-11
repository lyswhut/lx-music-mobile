import * as React from 'react';
// @ts-ignore file to be used only if `react-native-reanimated` available in the project
import Animated from 'react-native-reanimated';

export default React.createContext<Animated.SharedValue<number> | undefined>(
  undefined,
);
