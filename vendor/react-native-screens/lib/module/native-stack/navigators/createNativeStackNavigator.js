function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
import { createNavigatorFactory, StackActions, StackRouter, useNavigationBuilder } from '@react-navigation/native';
import * as React from 'react';
import NativeStackView from '../views/NativeStackView';
function NativeStackNavigator({
  initialRouteName,
  children,
  screenOptions,
  ...rest
}) {
  const {
    state,
    descriptors,
    navigation
  } = useNavigationBuilder(StackRouter, {
    initialRouteName,
    children,
    screenOptions
  });

  // Starting from React Navigation v6, `native-stack` should be imported from
  // `@react-navigation/native-stack` rather than `react-native-screens/native-stack`
  React.useEffect(() => {
    // @ts-ignore navigation.dangerouslyGetParent was removed in v6
    if (navigation?.dangerouslyGetParent === undefined) {
      console.warn('Looks like you are importing `native-stack` from `react-native-screens/native-stack`. Since version 6 of `react-navigation`, it should be imported from `@react-navigation/native-stack`.');
    }
  }, [navigation]);
  React.useEffect(() =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation?.addListener?.('tabPress', e => {
    const isFocused = navigation.isFocused();

    // Run the operation in the next frame so we're sure all listeners have been run
    // This is necessary to know if preventDefault() has been called
    requestAnimationFrame(() => {
      if (state.index > 0 && isFocused && !e.defaultPrevented) {
        // When user taps on already focused tab and we're inside the tab,
        // reset the stack to replicate native behaviour
        navigation.dispatch({
          ...StackActions.popToTop(),
          target: state.key
        });
      }
    });
  }), [navigation, state.index, state.key]);
  return /*#__PURE__*/React.createElement(NativeStackView, _extends({}, rest, {
    state: state,
    navigation: navigation,
    descriptors: descriptors
  }));
}
export default createNavigatorFactory(NativeStackNavigator);
//# sourceMappingURL=createNativeStackNavigator.js.map