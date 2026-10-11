"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _reactNative = require("react-native");
var _FullWindowOverlayNativeComponent = _interopRequireDefault(require("../fabric/FullWindowOverlayNativeComponent"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// Native components

const NativeFullWindowOverlay = _FullWindowOverlayNativeComponent.default;
function FullWindowOverlay(props) {
  if (_reactNative.Platform.OS !== 'ios') {
    console.warn('Using FullWindowOverlay is only valid on iOS devices.');
    return /*#__PURE__*/_react.default.createElement(_reactNative.View, props);
  }
  return /*#__PURE__*/_react.default.createElement(NativeFullWindowOverlay, {
    style: {
      position: 'absolute',
      width: '100%',
      height: '100%'
    }
  }, props.children);
}
var _default = exports.default = FullWindowOverlay;
//# sourceMappingURL=FullWindowOverlay.js.map