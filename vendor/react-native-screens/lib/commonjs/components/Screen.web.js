"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.ScreenContext = exports.NativeScreen = exports.InnerScreen = void 0;
var _reactNative = require("react-native");
var _react = _interopRequireDefault(require("react"));
var _core = require("../core");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const InnerScreen = exports.InnerScreen = _reactNative.View;

// We're using class component here because of the error from reanimated:
// createAnimatedComponent` does not support stateless functional components; use a class component instead.
class NativeScreen extends _react.default.Component {
  render() {
    let {
      active,
      activityState,
      style,
      enabled = (0, _core.screensEnabled)(),
      ...rest
    } = this.props;
    if (enabled) {
      if (active !== undefined && activityState === undefined) {
        activityState = active !== 0 ? 2 : 0; // change taken from index.native.tsx
      }
      return /*#__PURE__*/_react.default.createElement(_reactNative.View
      // @ts-expect-error: hidden exists on web, but not in React Native
      , _extends({
        hidden: activityState === 0,
        style: [style, {
          display: activityState !== 0 ? 'flex' : 'none'
        }]
      }, rest));
    }
    return /*#__PURE__*/_react.default.createElement(_reactNative.View, rest);
  }
}
exports.NativeScreen = NativeScreen;
const Screen = _reactNative.Animated.createAnimatedComponent(NativeScreen);
const ScreenContext = exports.ScreenContext = /*#__PURE__*/_react.default.createContext(Screen);
var _default = exports.default = Screen;
//# sourceMappingURL=Screen.web.js.map