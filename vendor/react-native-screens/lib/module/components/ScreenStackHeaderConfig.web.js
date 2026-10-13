function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
import { Image, View } from 'react-native';
import React from 'react';
export const ScreenStackHeaderBackButtonImage = props => /*#__PURE__*/React.createElement(View, null, /*#__PURE__*/React.createElement(Image, _extends({
  resizeMode: "center",
  fadeDuration: 0
}, props)));
export const ScreenStackHeaderRightView = props => /*#__PURE__*/React.createElement(View, props);
export const ScreenStackHeaderLeftView = props => /*#__PURE__*/React.createElement(View, props);
export const ScreenStackHeaderCenterView = props => /*#__PURE__*/React.createElement(View, props);
export const ScreenStackHeaderSearchBarView = props => /*#__PURE__*/React.createElement(View, props);
export const ScreenStackHeaderConfig = props => /*#__PURE__*/React.createElement(View, props);
export const ScreenStackHeaderSubview = View;
//# sourceMappingURL=ScreenStackHeaderConfig.web.js.map