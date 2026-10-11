"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.ScreenContext = exports.NativeScreen = exports.InnerScreen = void 0;
var _react = _interopRequireDefault(require("react"));
var _reactNative = require("react-native");
var _TransitionProgressContext = _interopRequireDefault(require("../TransitionProgressContext"));
var _DelayedFreeze = _interopRequireDefault(require("./helpers/DelayedFreeze"));
var _core = require("../core");
var _ScreenNativeComponent = _interopRequireDefault(require("../fabric/ScreenNativeComponent"));
var _ModalScreenNativeComponent = _interopRequireDefault(require("../fabric/ModalScreenNativeComponent"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); } // Native components
const NativeScreen = exports.NativeScreen = _ScreenNativeComponent.default;
const AnimatedNativeScreen = _reactNative.Animated.createAnimatedComponent(NativeScreen);
const AnimatedNativeModalScreen = _reactNative.Animated.createAnimatedComponent(_ModalScreenNativeComponent.default);

// Incomplete type, all accessible properties available at:
// react-native/Libraries/Components/View/ReactNativeViewViewConfig.js

const InnerScreen = exports.InnerScreen = /*#__PURE__*/_react.default.forwardRef(function InnerScreen(props, ref) {
  const innerRef = _react.default.useRef(null);
  _react.default.useImperativeHandle(ref, () => innerRef.current, []);
  const setRef = ref => {
    innerRef.current = ref;
    props.onComponentRef?.(ref);
  };
  const closing = _react.default.useRef(new _reactNative.Animated.Value(0)).current;
  const progress = _react.default.useRef(new _reactNative.Animated.Value(0)).current;
  const goingForward = _react.default.useRef(new _reactNative.Animated.Value(0)).current;
  const {
    enabled = (0, _core.screensEnabled)(),
    freezeOnBlur = (0, _core.freezeEnabled)(),
    ...rest
  } = props;

  // To maintain default behavior of formSheet stack presentation style and to have reasonable
  // defaults for new medium-detent iOS API we need to set defaults here
  const {
    sheetAllowedDetents = 'large',
    sheetLargestUndimmedDetent = 'all',
    sheetGrabberVisible = false,
    sheetCornerRadius = -1.0,
    sheetExpandsWhenScrolledToEdge = true,
    stackPresentation
  } = rest;
  if (enabled && _core.isNativePlatformSupported) {
    // Due to how Yoga resolves layout, we need to have different components for modal nad non-modal screens
    const AnimatedScreen = _reactNative.Platform.OS === 'android' || stackPresentation === undefined || stackPresentation === 'push' || stackPresentation === 'containedModal' || stackPresentation === 'containedTransparentModal' ? AnimatedNativeScreen : AnimatedNativeModalScreen;
    let {
      // Filter out active prop in this case because it is unused and
      // can cause problems depending on react-native version:
      // https://github.com/react-navigation/react-navigation/issues/4886
      active,
      activityState,
      children,
      isNativeStack,
      gestureResponseDistance,
      onGestureCancel,
      ...props
    } = rest;
    if (active !== undefined && activityState === undefined) {
      console.warn('It appears that you are using old version of react-navigation library. Please update @react-navigation/bottom-tabs, @react-navigation/stack and @react-navigation/drawer to version 5.10.0 or above to take full advantage of new functionality added to react-native-screens');
      activityState = active !== 0 ? 2 : 0; // in the new version, we need one of the screens to have value of 2 after the transition
    }
    const handleRef = ref => {
      if (ref?.viewConfig?.validAttributes?.style) {
        ref.viewConfig.validAttributes.style = {
          ...ref.viewConfig.validAttributes.style,
          display: false
        };
        setRef(ref);
      } else if (ref?._viewConfig?.validAttributes?.style) {
        ref._viewConfig.validAttributes.style = {
          ...ref._viewConfig.validAttributes.style,
          display: false
        };
        setRef(ref);
      }
    };
    return /*#__PURE__*/_react.default.createElement(_DelayedFreeze.default, {
      freeze: freezeOnBlur && activityState === 0
    }, /*#__PURE__*/_react.default.createElement(AnimatedScreen, _extends({}, props, {
      activityState: activityState,
      sheetAllowedDetents: sheetAllowedDetents,
      sheetLargestUndimmedDetent: sheetLargestUndimmedDetent,
      sheetGrabberVisible: sheetGrabberVisible,
      sheetCornerRadius: sheetCornerRadius,
      sheetExpandsWhenScrolledToEdge: sheetExpandsWhenScrolledToEdge,
      gestureResponseDistance: {
        start: gestureResponseDistance?.start ?? -1,
        end: gestureResponseDistance?.end ?? -1,
        top: gestureResponseDistance?.top ?? -1,
        bottom: gestureResponseDistance?.bottom ?? -1
      }
      // This prevents showing blank screen when navigating between multiple screens with freezing
      // https://github.com/software-mansion/react-native-screens/pull/1208
      ,
      ref: handleRef,
      onTransitionProgress: !isNativeStack ? undefined : _reactNative.Animated.event([{
        nativeEvent: {
          progress,
          closing,
          goingForward
        }
      }], {
        useNativeDriver: true
      }),
      onGestureCancel: onGestureCancel ?? (() => {
        // for internal use
      })
    }), !isNativeStack ?
    // see comment of this prop in types.tsx for information why it is needed
    children : /*#__PURE__*/_react.default.createElement(_TransitionProgressContext.default.Provider, {
      value: {
        progress,
        closing,
        goingForward
      }
    }, children)));
  } else {
    // same reason as above
    let {
      active,
      activityState,
      style,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onComponentRef,
      ...props
    } = rest;
    if (active !== undefined && activityState === undefined) {
      activityState = active !== 0 ? 2 : 0;
    }
    return /*#__PURE__*/_react.default.createElement(_reactNative.Animated.View, _extends({
      style: [style, {
        display: activityState !== 0 ? 'flex' : 'none'
      }],
      ref: setRef
    }, props));
  }
});

// context to be used when the user wants to use enhanced implementation
// e.g. to use `useReanimatedTransitionProgress` (see `reanimated` folder in repo)
const ScreenContext = exports.ScreenContext = /*#__PURE__*/_react.default.createContext(InnerScreen);
const Screen = props => {
  const ScreenWrapper = _react.default.useContext(ScreenContext) || InnerScreen;
  return /*#__PURE__*/_react.default.createElement(ScreenWrapper, props);
};
var _default = exports.default = Screen;
//# sourceMappingURL=Screen.js.map