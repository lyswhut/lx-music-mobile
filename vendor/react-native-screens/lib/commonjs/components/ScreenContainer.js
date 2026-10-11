"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.NativeScreenNavigationContainer = exports.NativeScreenContainer = void 0;
var _reactNative = require("react-native");
var _react = _interopRequireDefault(require("react"));
var _core = require("../core");
var _ScreenContainerNativeComponent = _interopRequireDefault(require("../fabric/ScreenContainerNativeComponent"));
var _ScreenNavigationContainerNativeComponent = _interopRequireDefault(require("../fabric/ScreenNavigationContainerNativeComponent"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// Native components

const NativeScreenContainer = exports.NativeScreenContainer = _reactNative.Platform.OS !== 'web' ? _ScreenContainerNativeComponent.default : _reactNative.View;
const NativeScreenNavigationContainer = exports.NativeScreenNavigationContainer = _reactNative.Platform.OS !== 'web' ? _ScreenNavigationContainerNativeComponent.default : _reactNative.View;
function ScreenContainer(props) {
  const {
    enabled = (0, _core.screensEnabled)(),
    hasTwoStates,
    ...rest
  } = props;
  if (enabled && _core.isNativePlatformSupported) {
    if (hasTwoStates) {
      const ScreenNavigationContainer = _reactNative.Platform.OS === 'ios' ? NativeScreenNavigationContainer : NativeScreenContainer;
      return /*#__PURE__*/_react.default.createElement(ScreenNavigationContainer, rest);
    }
    return /*#__PURE__*/_react.default.createElement(NativeScreenContainer, rest);
  }
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, rest);
}
var _default = exports.default = ScreenContainer;
//# sourceMappingURL=ScreenContainer.js.map