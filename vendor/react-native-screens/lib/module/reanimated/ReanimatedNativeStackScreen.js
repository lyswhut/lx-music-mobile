function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
import React from 'react';
import { Platform } from 'react-native';
import { InnerScreen } from 'react-native-screens';

// @ts-ignore file to be used only if `react-native-reanimated` available in the project
import Animated, { useEvent, useSharedValue } from 'react-native-reanimated';
import ReanimatedTransitionProgressContext from './ReanimatedTransitionProgressContext';
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';
import getDefaultHeaderHeight from '../native-stack/utils/getDefaultHeaderHeight';
import getStatusBarHeight from '../native-stack/utils/getStatusBarHeight';
import ReanimatedHeaderHeightContext from './ReanimatedHeaderHeightContext';
const AnimatedScreen = Animated.createAnimatedComponent(InnerScreen);

// We use prop added to global by reanimated since it seems safer than the one from RN. See:
// https://github.com/software-mansion/react-native-reanimated/blob/3fe8b35b05e82b2f2aefda1fb97799cf81e4b7bb/src/reanimated2/UpdateProps.ts#L46
// @ts-expect-error nativeFabricUIManager is not yet included in the RN types
const ENABLE_FABRIC = !!global?._IS_FABRIC;
const ReanimatedNativeStackScreen = /*#__PURE__*/React.forwardRef((props, ref) => {
  const {
    children,
    ...rest
  } = props;
  const {
    stackPresentation = 'push',
    hasLargeHeader
  } = rest;
  const dimensions = useSafeAreaFrame();
  const topInset = useSafeAreaInsets().top;
  const isStatusBarTranslucent = rest.statusBarTranslucent ?? false;
  const statusBarHeight = getStatusBarHeight(topInset, dimensions, isStatusBarTranslucent);

  // Default header height, normally used in `useHeaderHeight` hook.
  // Here, it is used for returning a default value for shared value.
  const defaultHeaderHeight = getDefaultHeaderHeight(dimensions, statusBarHeight, stackPresentation, hasLargeHeader);
  const cachedHeaderHeight = React.useRef(defaultHeaderHeight);
  const headerHeight = useSharedValue(defaultHeaderHeight);
  const progress = useSharedValue(0);
  const closing = useSharedValue(0);
  const goingForward = useSharedValue(0);
  return /*#__PURE__*/React.createElement(AnimatedScreen
  // @ts-ignore some problems with ref and onTransitionProgressReanimated being "fake" prop for parsing of `useEvent` return value
  , _extends({
    ref: ref,
    onTransitionProgressReanimated: useEvent(event => {
      'worklet';

      progress.value = event.progress;
      closing.value = event.closing;
      goingForward.value = event.goingForward;
    }, [
    // This should not be necessary, but is not properly managed by `react-native-reanimated`
    // @ts-ignore wrong type
    Platform.OS === 'android' ? 'onTransitionProgress' :
    // for some reason there is a difference in required event name between architectures
    ENABLE_FABRIC ? 'onTransitionProgress' : 'topTransitionProgress']),
    onHeaderHeightChangeReanimated: useEvent(event => {
      'worklet';

      if (event.headerHeight !== cachedHeaderHeight.current) {
        headerHeight.value = event.headerHeight;
        cachedHeaderHeight.current = event.headerHeight;
      }
    }, [
    // @ts-ignore wrong type
    Platform.OS === 'android' ? 'onHeaderHeightChange' : ENABLE_FABRIC ? 'onHeaderHeightChange' : 'topHeaderHeightChange'])
  }, rest), /*#__PURE__*/React.createElement(ReanimatedHeaderHeightContext.Provider, {
    value: headerHeight
  }, /*#__PURE__*/React.createElement(ReanimatedTransitionProgressContext.Provider, {
    value: {
      progress,
      closing,
      goingForward
    }
  }, children)));
});
ReanimatedNativeStackScreen.displayName = 'ReanimatedNativeStackScreen';
export default ReanimatedNativeStackScreen;
//# sourceMappingURL=ReanimatedNativeStackScreen.js.map