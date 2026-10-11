"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GHContext = void 0;
var _react = _interopRequireDefault(require("react"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// context to be used when the user wants full screen swipe (see `gesture-handler` folder in repo)
const GHContext = exports.GHContext = /*#__PURE__*/_react.default.createContext(props => /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, props.children));
//# sourceMappingURL=GHContext.js.map