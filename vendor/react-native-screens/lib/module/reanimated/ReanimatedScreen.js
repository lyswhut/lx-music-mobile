function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
import React from 'react';
import { InnerScreen } from 'react-native-screens';

// @ts-ignore file to be used only if `react-native-reanimated` available in the project
import Animated from 'react-native-reanimated';
const AnimatedScreen = Animated.createAnimatedComponent(InnerScreen);
const ReanimatedScreen = /*#__PURE__*/React.forwardRef((props, ref) => {
  return /*#__PURE__*/React.createElement(AnimatedScreen
  // @ts-ignore some problems with ref and onTransitionProgressReanimated being "fake" prop for parsing of `useEvent` return value
  , _extends({
    ref: ref
  }, props));
});
ReanimatedScreen.displayName = 'ReanimatedScreen';
export default ReanimatedScreen;
//# sourceMappingURL=ReanimatedScreen.js.map