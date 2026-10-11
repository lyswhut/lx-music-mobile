import { Platform, View } from 'react-native';
import React from 'react';
import { ScreenContainerProps } from 'react-native-screens';
import { isNativePlatformSupported, screensEnabled } from '../core';

// Native components
import ScreenContainerNativeComponent from '../fabric/ScreenContainerNativeComponent';
import ScreenNavigationContainerNativeComponent from '../fabric/ScreenNavigationContainerNativeComponent';

export const NativeScreenContainer: React.ComponentType<ScreenContainerProps> =
  Platform.OS !== 'web' ? (ScreenContainerNativeComponent as any) : View;
export const NativeScreenNavigationContainer: React.ComponentType<ScreenContainerProps> =
  Platform.OS !== 'web'
    ? (ScreenNavigationContainerNativeComponent as any)
    : View;

function ScreenContainer(props: ScreenContainerProps) {
  const { enabled = screensEnabled(), hasTwoStates, ...rest } = props;

  if (enabled && isNativePlatformSupported) {
    if (hasTwoStates) {
      const ScreenNavigationContainer =
        Platform.OS === 'ios'
          ? NativeScreenNavigationContainer
          : NativeScreenContainer;
      return <ScreenNavigationContainer {...rest} />;
    }
    return <NativeScreenContainer {...rest} />;
  }
  return <View {...rest} />;
}

export default ScreenContainer;
