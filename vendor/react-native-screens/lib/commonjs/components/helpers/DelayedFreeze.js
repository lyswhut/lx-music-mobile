"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _reactFreeze = require("react-freeze");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// This component allows one more render before freezing the screen.
// Allows activityState to reach the native side and useIsFocused to work correctly.
function DelayedFreeze({
  freeze,
  children
}) {
  // flag used for determining whether freeze should be enabled
  const [freezeState, setFreezeState] = _react.default.useState(false);
  _react.default.useEffect(() => {
    const id = setImmediate(() => {
      setFreezeState(freeze);
    });
    return () => {
      clearImmediate(id);
    };
  }, [freeze]);
  return /*#__PURE__*/_react.default.createElement(_reactFreeze.Freeze, {
    freeze: freeze ? freezeState : false
  }, children);
}
var _default = exports.default = DelayedFreeze;
//# sourceMappingURL=DelayedFreeze.js.map