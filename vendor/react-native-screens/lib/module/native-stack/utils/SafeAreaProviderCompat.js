// code taken from
// https://github.com/react-navigation/react-navigation/blob/ec0d113eb25c39ef9defb6c7215640f44e3569ae/packages/elements/src/SafeAreaProviderCompat.tsx
import * as React from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import { initialWindowMetrics, SafeAreaInsetsContext, SafeAreaProvider } from 'react-native-safe-area-context';
const {
  width = 0,
  height = 0
} = Dimensions.get('window');

// To support SSR on web, we need to have empty insets for initial values
// Otherwise there can be mismatch between SSR and client output
// We also need to specify empty values to support tests environments
const initialMetrics = Platform.OS === 'web' || initialWindowMetrics == null ? {
  frame: {
    x: 0,
    y: 0,
    width,
    height
  },
  insets: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  }
} : initialWindowMetrics;
export default function SafeAreaProviderCompat({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement(SafeAreaInsetsContext.Consumer, null, insets => {
    if (insets) {
      // If we already have insets, don't wrap the stack in another safe area provider
      // This avoids an issue with updates at the cost of potentially incorrect values
      // https://github.com/react-navigation/react-navigation/issues/174
      return /*#__PURE__*/React.createElement(View, {
        style: [styles.container, style]
      }, children);
    }
    return /*#__PURE__*/React.createElement(SafeAreaProvider, {
      initialMetrics: initialMetrics,
      style: style
    }, children);
  });
}
SafeAreaProviderCompat.initialMetrics = initialMetrics;
const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
//# sourceMappingURL=SafeAreaProviderCompat.js.map