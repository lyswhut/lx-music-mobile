function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
import * as React from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
// @ts-ignore Getting private component
// eslint-disable-next-line import/no-named-as-default, import/default, import/no-named-as-default-member, import/namespace
import AppContainer from 'react-native/Libraries/ReactNative/AppContainer';
import warnOnce from 'warn-once';
import { ScreenStack, ScreenContext, GHContext } from 'react-native-screens';
import { StackActions, useTheme } from '@react-navigation/native';
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';
import HeaderConfig from './HeaderConfig';
import SafeAreaProviderCompat from '../utils/SafeAreaProviderCompat';
import getDefaultHeaderHeight from '../utils/getDefaultHeaderHeight';
import getStatusBarHeight from '../utils/getStatusBarHeight';
import HeaderHeightContext from '../utils/HeaderHeightContext';
import AnimatedHeaderHeightContext from '../utils/AnimatedHeaderHeightContext';
const isAndroid = Platform.OS === 'android';
let Container = View;
if (__DEV__) {
  const DebugContainer = props => {
    const {
      stackPresentation,
      ...rest
    } = props;
    if (Platform.OS === 'ios' && stackPresentation !== 'push') {
      return /*#__PURE__*/React.createElement(AppContainer, null, /*#__PURE__*/React.createElement(View, rest));
    }
    return /*#__PURE__*/React.createElement(View, rest);
  };
  // @ts-ignore Wrong props
  Container = DebugContainer;
}
const MaybeNestedStack = ({
  options,
  route,
  stackPresentation,
  children
}) => {
  const {
    colors
  } = useTheme();
  const {
    headerShown = true,
    contentStyle
  } = options;
  const Screen = React.useContext(ScreenContext);
  const isHeaderInModal = isAndroid ? false : stackPresentation !== 'push' && headerShown === true;
  const headerShownPreviousRef = React.useRef(headerShown);
  React.useEffect(() => {
    warnOnce(!isAndroid && stackPresentation !== 'push' && headerShownPreviousRef.current !== headerShown, `Dynamically changing 'headerShown' in modals will result in remounting the screen and losing all local state. See options for the screen '${route.name}'.`);
    headerShownPreviousRef.current = headerShown;
  }, [headerShown, stackPresentation, route.name]);
  const content = /*#__PURE__*/React.createElement(Container, {
    style: [styles.container, stackPresentation !== 'transparentModal' && stackPresentation !== 'containedTransparentModal' && {
      backgroundColor: colors.background
    }, contentStyle]
    // @ts-ignore Wrong props passed to View
    ,
    stackPresentation: stackPresentation
    // This view must *not* be flattened.
    // See https://github.com/software-mansion/react-native-screens/pull/1825
    // for detailed explanation.
    ,
    collapsable: false
  }, children);
  const dimensions = useSafeAreaFrame();
  const topInset = useSafeAreaInsets().top;
  const isStatusBarTranslucent = options.statusBarTranslucent ?? false;
  const statusBarHeight = getStatusBarHeight(topInset, dimensions, isStatusBarTranslucent);
  const hasLargeHeader = options.headerLargeTitle ?? false;
  const headerHeight = getDefaultHeaderHeight(dimensions, statusBarHeight, stackPresentation, hasLargeHeader);
  if (isHeaderInModal) {
    return /*#__PURE__*/React.createElement(ScreenStack, {
      style: styles.container
    }, /*#__PURE__*/React.createElement(Screen, {
      enabled: true,
      isNativeStack: true,
      hasLargeHeader: hasLargeHeader,
      style: StyleSheet.absoluteFill
    }, /*#__PURE__*/React.createElement(HeaderHeightContext.Provider, {
      value: headerHeight
    }, /*#__PURE__*/React.createElement(HeaderConfig, _extends({}, options, {
      route: route
    })), content)));
  }
  return content;
};
const RouteView = ({
  descriptors,
  route,
  index,
  navigation,
  stateKey,
  screensRefs
}) => {
  const {
    options,
    render: renderScene
  } = descriptors[route.key];
  const {
    fullScreenSwipeShadowEnabled = false,
    gestureEnabled,
    headerShown,
    hideKeyboardOnSwipe,
    homeIndicatorHidden,
    sheetAllowedDetents = 'large',
    sheetLargestUndimmedDetent = 'all',
    sheetGrabberVisible = false,
    sheetCornerRadius = -1.0,
    sheetExpandsWhenScrolledToEdge = true,
    nativeBackButtonDismissalEnabled = false,
    navigationBarColor,
    navigationBarTranslucent,
    navigationBarHidden,
    replaceAnimation = 'pop',
    screenOrientation,
    statusBarAnimation,
    statusBarColor,
    statusBarHidden,
    statusBarStyle,
    statusBarTranslucent,
    swipeDirection = 'horizontal',
    transitionDuration,
    freezeOnBlur
  } = options;
  let {
    customAnimationOnSwipe,
    fullScreenSwipeEnabled,
    gestureResponseDistance,
    stackAnimation,
    stackPresentation = 'push'
  } = options;
  if (swipeDirection === 'vertical') {
    // for `vertical` direction to work, we need to set `fullScreenSwipeEnabled` to `true`
    // so the screen can be dismissed from any point on screen.
    // `customAnimationOnSwipe` needs to be set to `true` so the `stackAnimation` set by user can be used,
    // otherwise `simple_push` will be used.
    // Also, the default animation for this direction seems to be `slide_from_bottom`.
    if (fullScreenSwipeEnabled === undefined) {
      fullScreenSwipeEnabled = true;
    }
    if (customAnimationOnSwipe === undefined) {
      customAnimationOnSwipe = true;
    }
    if (stackAnimation === undefined) {
      stackAnimation = 'slide_from_bottom';
    }
  }
  if (index === 0) {
    // first screen should always be treated as `push`, it resolves problems with no header animation
    // for navigator with first screen as `modal` and the next as `push`
    stackPresentation = 'push';
  }
  const dimensions = useSafeAreaFrame();
  const topInset = useSafeAreaInsets().top;
  const isStatusBarTranslucent = options.statusBarTranslucent ?? false;
  const statusBarHeight = getStatusBarHeight(topInset, dimensions, isStatusBarTranslucent);
  const hasLargeHeader = options.headerLargeTitle ?? false;
  const defaultHeaderHeight = getDefaultHeaderHeight(dimensions, statusBarHeight, stackPresentation, hasLargeHeader);
  const parentHeaderHeight = React.useContext(HeaderHeightContext);
  const isHeaderInPush = isAndroid ? headerShown : stackPresentation === 'push' && headerShown !== false;
  const staticHeaderHeight = isHeaderInPush !== false ? defaultHeaderHeight : parentHeaderHeight ?? 0;

  // We need to ensure the first retrieved header height will be cached and set in animatedHeaderHeight.
  // We're caching the header height here, as on iOS native side events are not always coming to the JS on first notify.
  // TODO: Check why first event is not being received once it is cached on the native side.
  const cachedAnimatedHeaderHeight = React.useRef(defaultHeaderHeight);
  const animatedHeaderHeight = React.useRef(new Animated.Value(staticHeaderHeight, {
    useNativeDriver: true
  })).current;
  const Screen = React.useContext(ScreenContext);
  const {
    dark
  } = useTheme();
  const screenRef = React.useRef(null);
  React.useEffect(() => {
    screensRefs.current[route.key] = screenRef;
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete screensRefs.current[route.key];
    };
  });
  return /*#__PURE__*/React.createElement(Screen, {
    key: route.key,
    ref: screenRef,
    enabled: true,
    isNativeStack: true,
    hasLargeHeader: hasLargeHeader,
    style: StyleSheet.absoluteFill,
    sheetAllowedDetents: sheetAllowedDetents,
    sheetLargestUndimmedDetent: sheetLargestUndimmedDetent,
    sheetGrabberVisible: sheetGrabberVisible,
    sheetCornerRadius: sheetCornerRadius,
    sheetExpandsWhenScrolledToEdge: sheetExpandsWhenScrolledToEdge,
    customAnimationOnSwipe: customAnimationOnSwipe,
    freezeOnBlur: freezeOnBlur,
    fullScreenSwipeEnabled: fullScreenSwipeEnabled,
    fullScreenSwipeShadowEnabled: fullScreenSwipeShadowEnabled,
    hideKeyboardOnSwipe: hideKeyboardOnSwipe,
    homeIndicatorHidden: homeIndicatorHidden,
    gestureEnabled: isAndroid ? false : gestureEnabled,
    gestureResponseDistance: gestureResponseDistance,
    nativeBackButtonDismissalEnabled: nativeBackButtonDismissalEnabled,
    navigationBarColor: navigationBarColor,
    navigationBarTranslucent: navigationBarTranslucent,
    navigationBarHidden: navigationBarHidden,
    replaceAnimation: replaceAnimation,
    screenOrientation: screenOrientation,
    stackAnimation: stackAnimation,
    stackPresentation: stackPresentation,
    statusBarAnimation: statusBarAnimation,
    statusBarColor: statusBarColor,
    statusBarHidden: statusBarHidden,
    statusBarStyle: statusBarStyle ?? (dark ? 'light' : 'dark'),
    statusBarTranslucent: statusBarTranslucent,
    swipeDirection: swipeDirection,
    transitionDuration: transitionDuration,
    onHeaderBackButtonClicked: () => {
      navigation.dispatch({
        ...StackActions.pop(),
        source: route.key,
        target: stateKey
      });
    },
    onWillAppear: () => {
      navigation.emit({
        type: 'transitionStart',
        data: {
          closing: false
        },
        target: route.key
      });
    },
    onWillDisappear: () => {
      navigation.emit({
        type: 'transitionStart',
        data: {
          closing: true
        },
        target: route.key
      });
    },
    onAppear: () => {
      navigation.emit({
        type: 'appear',
        target: route.key
      });
      navigation.emit({
        type: 'transitionEnd',
        data: {
          closing: false
        },
        target: route.key
      });
    },
    onDisappear: () => {
      navigation.emit({
        type: 'transitionEnd',
        data: {
          closing: true
        },
        target: route.key
      });
    },
    onHeaderHeightChange: e => {
      const headerHeight = e.nativeEvent.headerHeight;
      if (cachedAnimatedHeaderHeight.current !== headerHeight) {
        // Currently, we're setting value by Animated#setValue, because we want to cache animated value.
        // Also, in React Native 0.72 there was a bug on Fabric causing a large delay between the screen transition,
        // which should not occur.
        // TODO: Check if it's possible to replace animated#setValue to Animated#event.
        animatedHeaderHeight.setValue(headerHeight);
        cachedAnimatedHeaderHeight.current = headerHeight;
      }
    },
    onDismissed: e => {
      navigation.emit({
        type: 'dismiss',
        target: route.key
      });
      const dismissCount = e.nativeEvent.dismissCount > 0 ? e.nativeEvent.dismissCount : 1;
      navigation.dispatch({
        ...StackActions.pop(dismissCount),
        source: route.key,
        target: stateKey
      });
    },
    onGestureCancel: () => {
      navigation.emit({
        type: 'gestureCancel',
        target: route.key
      });
    }
  }, /*#__PURE__*/React.createElement(AnimatedHeaderHeightContext.Provider, {
    value: animatedHeaderHeight
  }, /*#__PURE__*/React.createElement(HeaderHeightContext.Provider, {
    value: staticHeaderHeight
  }, /*#__PURE__*/React.createElement(MaybeNestedStack, {
    options: options,
    route: route,
    stackPresentation: stackPresentation
  }, renderScene()), /*#__PURE__*/React.createElement(HeaderConfig, _extends({}, options, {
    route: route,
    headerShown: isHeaderInPush
  })))));
};
function NativeStackViewInner({
  state,
  navigation,
  descriptors
}) {
  const {
    key,
    routes
  } = state;
  const currentRouteKey = routes[state.index].key;
  const {
    goBackGesture,
    transitionAnimation,
    screenEdgeGesture
  } = descriptors[currentRouteKey].options;
  const gestureDetectorBridge = React.useRef({
    stackUseEffectCallback: _stackRef => {
      // this method will be override in GestureDetector
    }
  });
  const screensRefs = React.useRef({});
  const ScreenGestureDetector = React.useContext(GHContext);
  React.useEffect(() => {
    if (ScreenGestureDetector.name !== 'GHWrapper' && goBackGesture !== undefined) {
      console.warn('Cannot detect GestureDetectorProvider in a screen that uses `goBackGesture`. Make sure your navigator is wrapped in GestureDetectorProvider.');
    }
  }, [ScreenGestureDetector.name, goBackGesture]);
  return /*#__PURE__*/React.createElement(ScreenGestureDetector, {
    gestureDetectorBridge: gestureDetectorBridge,
    goBackGesture: goBackGesture,
    transitionAnimation: transitionAnimation,
    screenEdgeGesture: screenEdgeGesture ?? false,
    screensRefs: screensRefs,
    currentRouteKey: currentRouteKey
  }, /*#__PURE__*/React.createElement(ScreenStack, {
    style: styles.container,
    gestureDetectorBridge: gestureDetectorBridge
  }, routes.map((route, index) => /*#__PURE__*/React.createElement(RouteView, {
    key: route.key,
    descriptors: descriptors,
    route: route,
    index: index,
    navigation: navigation,
    stateKey: key,
    screensRefs: screensRefs
  }))));
}
export default function NativeStackView(props) {
  return /*#__PURE__*/React.createElement(SafeAreaProviderCompat, null, /*#__PURE__*/React.createElement(NativeStackViewInner, props));
}
const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
//# sourceMappingURL=NativeStackView.js.map