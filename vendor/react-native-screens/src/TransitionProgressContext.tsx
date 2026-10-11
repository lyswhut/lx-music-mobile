import * as React from 'react';
import { Animated } from 'react-native';

type TransitionProgressContextBody = {
  progress: Animated.Value;
  closing: Animated.Value;
  goingForward: Animated.Value;
};

export default React.createContext<TransitionProgressContextBody | undefined>(
  undefined,
);
