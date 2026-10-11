import * as React from 'react';
import { Animated } from 'react-native';

const AnimatedHeaderHeightContext = React.createContext<
  Animated.Value | undefined
>(undefined);

export default AnimatedHeaderHeightContext;
