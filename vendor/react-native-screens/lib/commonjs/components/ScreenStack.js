"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _reactNativeScreens = require("react-native-screens");
var _DelayedFreeze = _interopRequireDefault(require("./helpers/DelayedFreeze"));
var _ScreenStackNativeComponent = _interopRequireDefault(require("../fabric/ScreenStackNativeComponent"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); } // Native components
const NativeScreenStack = _ScreenStackNativeComponent.default;
function isFabric() {
  return 'nativeFabricUIManager' in global;
}
function ScreenStack(props) {
  const {
    children,
    gestureDetectorBridge,
    ...rest
  } = props;
  const ref = _react.default.useRef(null);
  const size = _react.default.Children.count(children);
  // freezes all screens except the top one
  const childrenWithFreeze = _react.default.Children.map(children, (child, index) => {
    // @ts-expect-error it's either SceneView in v6 or RouteView in v5
    const {
      props,
      key
    } = child;
    const descriptor = props?.descriptor ?? props?.descriptors?.[key];
    const isFreezeEnabled = descriptor?.options?.freezeOnBlur ?? (0, _reactNativeScreens.freezeEnabled)();

    // On Fabric, when screen is frozen, animated and reanimated values are not updated
    // due to component being unmounted. To avoid this, we don't freeze the previous screen there
    const freezePreviousScreen = isFabric() ? size - index > 2 : size - index > 1;
    return /*#__PURE__*/_react.default.createElement(_DelayedFreeze.default, {
      freeze: isFreezeEnabled && freezePreviousScreen
    }, child);
  });
  _react.default.useEffect(() => {
    if (gestureDetectorBridge) {
      gestureDetectorBridge.current.stackUseEffectCallback(ref);
    }
  });
  return /*#__PURE__*/_react.default.createElement(NativeScreenStack, _extends({}, rest, {
    ref: ref
  }), childrenWithFreeze);
}
var _default = exports.default = ScreenStack;
//# sourceMappingURL=ScreenStack.js.map