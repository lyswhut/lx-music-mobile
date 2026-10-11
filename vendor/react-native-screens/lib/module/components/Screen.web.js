function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
import { Animated, View } from 'react-native';
import React from 'react';
import { screensEnabled } from '../core';
export const InnerScreen = View;

// We're using class component here because of the error from reanimated:
// createAnimatedComponent` does not support stateless functional components; use a class component instead.
export class NativeScreen extends React.Component {
  render() {
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
      return /*#__PURE__*/React.createElement(View
      // @ts-expect-error: hidden exists on web, but not in React Native
      , _extends({
        hidden: activityState === 0,
        style: [style, {
          display: activityState !== 0 ? 'flex' : 'none'
        }]
      }, rest));
    }
    return /*#__PURE__*/React.createElement(View, rest);
  }
}
const Screen = Animated.createAnimatedComponent(NativeScreen);
export const ScreenContext = /*#__PURE__*/React.createContext(Screen);
export default Screen;
//# sourceMappingURL=Screen.web.js.map