"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useBackPressSubscription = useBackPressSubscription;
var _react = _interopRequireDefault(require("react"));
var _reactNative = require("react-native");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * This hook is an abstraction for keeping back press subscription
 * logic in one place.
 */
function useBackPressSubscription({
  onBackPress,
  isDisabled
}) {
  const [isActive, setIsActive] = _react.default.useState(false);
  const subscription = _react.default.useRef();
  const clearSubscription = _react.default.useCallback((shouldSetActive = true) => {
    subscription.current?.remove();
    subscription.current = undefined;
    if (shouldSetActive) setIsActive(false);
  }, []);
  const createSubscription = _react.default.useCallback(() => {
    if (!isDisabled) {
      subscription.current?.remove();
      subscription.current = _reactNative.BackHandler.addEventListener('hardwareBackPress', onBackPress);
      setIsActive(true);
    }
  }, [isDisabled, onBackPress]);
  const handleAttached = _react.default.useCallback(() => {
    if (isActive) {
      createSubscription();
    }
  }, [createSubscription, isActive]);
  const handleDetached = _react.default.useCallback(() => {
    clearSubscription(false);
  }, [clearSubscription]);
  _react.default.useEffect(() => {
    if (isDisabled) {
      clearSubscription();
    }
  }, [isDisabled, clearSubscription]);
  return {
    handleAttached,
    handleDetached,
    createSubscription,
    clearSubscription
  };
}
//# sourceMappingURL=useBackPressSubscription.js.map