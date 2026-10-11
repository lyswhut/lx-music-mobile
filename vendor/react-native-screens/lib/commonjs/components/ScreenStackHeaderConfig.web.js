"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ScreenStackHeaderSubview = exports.ScreenStackHeaderSearchBarView = exports.ScreenStackHeaderRightView = exports.ScreenStackHeaderLeftView = exports.ScreenStackHeaderConfig = exports.ScreenStackHeaderCenterView = exports.ScreenStackHeaderBackButtonImage = void 0;
var _reactNative = require("react-native");
var _react = _interopRequireDefault(require("react"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const ScreenStackHeaderBackButtonImage = props => /*#__PURE__*/_react.default.createElement(_reactNative.View, null, /*#__PURE__*/_react.default.createElement(_reactNative.Image, _extends({
  resizeMode: "center",
  fadeDuration: 0
}, props)));
exports.ScreenStackHeaderBackButtonImage = ScreenStackHeaderBackButtonImage;
const ScreenStackHeaderRightView = props => /*#__PURE__*/_react.default.createElement(_reactNative.View, props);
exports.ScreenStackHeaderRightView = ScreenStackHeaderRightView;
const ScreenStackHeaderLeftView = props => /*#__PURE__*/_react.default.createElement(_reactNative.View, props);
exports.ScreenStackHeaderLeftView = ScreenStackHeaderLeftView;
const ScreenStackHeaderCenterView = props => /*#__PURE__*/_react.default.createElement(_reactNative.View, props);
exports.ScreenStackHeaderCenterView = ScreenStackHeaderCenterView;
const ScreenStackHeaderSearchBarView = props => /*#__PURE__*/_react.default.createElement(_reactNative.View, props);
exports.ScreenStackHeaderSearchBarView = ScreenStackHeaderSearchBarView;
const ScreenStackHeaderConfig = props => /*#__PURE__*/_react.default.createElement(_reactNative.View, props);
exports.ScreenStackHeaderConfig = ScreenStackHeaderConfig;
const ScreenStackHeaderSubview = exports.ScreenStackHeaderSubview = _reactNative.View;
//# sourceMappingURL=ScreenStackHeaderConfig.web.js.map