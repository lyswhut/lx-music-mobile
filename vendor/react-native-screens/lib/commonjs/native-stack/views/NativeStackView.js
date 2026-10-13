"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = NativeStackView;
var React = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _AppContainer = _interopRequireDefault(require("react-native/Libraries/ReactNative/AppContainer"));
var _warnOnce = _interopRequireDefault(require("warn-once"));
var _reactNativeScreens = require("react-native-screens");
var _native = require("@react-navigation/native");
var _reactNativeSafeAreaContext = require("react-native-safe-area-context");
var _HeaderConfig = _interopRequireDefault(require("./HeaderConfig"));
var _SafeAreaProviderCompat = _interopRequireDefault(require("../utils/SafeAreaProviderCompat"));
var _getDefaultHeaderHeight = _interopRequireDefault(require("../utils/getDefaultHeaderHeight"));
var _getStatusBarHeight = _interopRequireDefault(require("../utils/getStatusBarHeight"));
var _HeaderHeightContext = _interopRequireDefault(require("../utils/HeaderHeightContext"));
var _AnimatedHeaderHeightContext = _interopRequireDefault(require("../utils/AnimatedHeaderHeightContext"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); } // @ts-ignore Getting private component
// eslint-disable-next-line import/no-named-as-default, import/default, import/no-named-as-default-member, import/namespace
const isAndroid = _reactNative.Platform.OS === 'android';
let Container = _reactNative.View;
if (__DEV__) {
  const DebugContainer = props => {
    const {
      stackPresentation,
      ...rest
    } = props;
    if (_reactNative.Platform.OS === 'ios' && stackPresentation !== 'push') {
      return /*#__PURE__*/React.createElement(_AppContainer.default, null, /*#__PURE__*/React.createElement(_reactNative.View, rest));
    }
    return /*#__PURE__*/React.createElement(_reactNative.View, rest);
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
  } = (0, _native.useTheme)();
  const {
    headerShown = true,
    contentStyle
  } = options;
  const Screen = React.useContext(_reactNativeScreens.ScreenContext);
  const isHeaderInModal = isAndroid ? false : stackPresentation !== 'push' && headerShown === true;
  const headerShownPreviousRef = React.useRef(headerShown);
  React.useEffect(() => {
    (0, _warnOnce.default)(!isAndroid && stackPresentation !== 'push' && headerShownPreviousRef.current !== headerShown, `Dynamically changing 'headerShown' in modals will result in remounting the screen and losing all local state. See options for the screen '${route.name}'.`);
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
  const dimensions = (0, _reactNativeSafeAreaContext.useSafeAreaFrame)();
  const topInset = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)().top;
  const isStatusBarTranslucent = options.statusBarTranslucent ?? false;
  const statusBarHeight = (0, _getStatusBarHeight.default)(topInset, dimensions, isStatusBarTranslucent);
  const hasLargeHeader = options.headerLargeTitle ?? false;
  const headerHeight = (0, _getDefaultHeaderHeight.default)(dimensions, statusBarHeight, stackPresentation, hasLargeHeader);
  if (isHeaderInModal) {
    return /*#__PURE__*/React.createElement(_reactNativeScreens.ScreenStack, {
      style: styles.container
    }, /*#__PURE__*/React.createElement(Screen, {
      enabled: true,
      isNativeStack: true,
      hasLargeHeader: hasLargeHeader,
      style: _reactNative.StyleSheet.absoluteFill
    }, /*#__PURE__*/React.createElement(_HeaderHeightContext.default.Provider, {
      value: headerHeight
    }, /*#__PURE__*/React.createElement(_HeaderConfig.default, _extends({}, options, {
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
  const dimensions = (0, _reactNativeSafeAreaContext.useSafeAreaFrame)();
  const topInset = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)().top;
  const isStatusBarTranslucent = options.statusBarTranslucent ?? false;
  const statusBarHeight = (0, _getStatusBarHeight.default)(topInset, dimensions, isStatusBarTranslucent);
  const hasLargeHeader = options.headerLargeTitle ?? false;
  const defaultHeaderHeight = (0, _getDefaultHeaderHeight.default)(dimensions, statusBarHeight, stackPresentation, hasLargeHeader);
  const parentHeaderHeight = React.useContext(_HeaderHeightContext.default);
  const isHeaderInPush = isAndroid ? headerShown : stackPresentation === 'push' && headerShown !== false;
  const staticHeaderHeight = isHeaderInPush !== false ? defaultHeaderHeight : parentHeaderHeight ?? 0;

  // We need to ensure the first retrieved header height will be cached and set in animatedHeaderHeight.
  // We're caching the header height here, as on iOS native side events are not always coming to the JS on first notify.
  // TODO: Check why first event is not being received once it is cached on the native side.
  const cachedAnimatedHeaderHeight = React.useRef(defaultHeaderHeight);
  const animatedHeaderHeight = React.useRef(new _reactNative.Animated.Value(staticHeaderHeight, {
    useNativeDriver: true
  })).current;
  const Screen = React.useContext(_reactNativeScreens.ScreenContext);
  const {
    dark
  } = (0, _native.useTheme)();
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
    style: _reactNative.StyleSheet.absoluteFill,
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
        ..._native.StackActions.pop(),
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
        ..._native.StackActions.pop(dismissCount),
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
  }, /*#__PURE__*/React.createElement(_AnimatedHeaderHeightContext.default.Provider, {
    value: animatedHeaderHeight
  }, /*#__PURE__*/React.createElement(_HeaderHeightContext.default.Provider, {
    value: staticHeaderHeight
  }, /*#__PURE__*/React.createElement(MaybeNestedStack, {
    options: options,
    route: route,
    stackPresentation: stackPresentation
  }, renderScene()), /*#__PURE__*/React.createElement(_HeaderConfig.default, _extends({}, options, {
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
  const ScreenGestureDetector = React.useContext(_reactNativeScreens.GHContext);
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
  }, /*#__PURE__*/React.createElement(_reactNativeScreens.ScreenStack, {
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
function NativeStackView(props) {
  return /*#__PURE__*/React.createElement(_SafeAreaProviderCompat.default, null, /*#__PURE__*/React.createElement(NativeStackViewInner, props));
}
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1
  }
});
//# sourceMappingURL=NativeStackView.js.map