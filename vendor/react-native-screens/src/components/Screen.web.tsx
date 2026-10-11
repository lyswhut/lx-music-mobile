import { ScreenProps } from 'react-native-screens';
import { Animated, View } from 'react-native';
import React from 'react';

import { screensEnabled } from '../core';

export const InnerScreen = View;

// We're using class component here because of the error from reanimated:
// createAnimatedComponent` does not support stateless functional components; use a class component instead.
export class NativeScreen extends React.Component<ScreenProps> {
  render(): JSX.Element {
    let {
      active,
      activityState,
      style,
      enabled = screensEnabled(),
      ...rest
    } = this.props;

    if (enabled) {
      if (active !== undefined && activityState === undefined) {
        activityState = active !== 0 ? 2 : 0; // change taken from index.native.tsx
      }
      return (
        <View
          // @ts-expect-error: hidden exists on web, but not in React Native
          hidden={activityState === 0}
          style={[style, { display: activityState !== 0 ? 'flex' : 'none' }]}
          {...rest}
        />
      );
    }

    return <View {...rest} />;
  }
}

const Screen = Animated.createAnimatedComponent(NativeScreen);

export const ScreenContext = React.createContext(Screen);

export default Screen;
