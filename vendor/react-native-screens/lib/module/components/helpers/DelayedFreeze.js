import React from 'react';
import { Freeze } from 'react-freeze';
// This component allows one more render before freezing the screen.
// Allows activityState to reach the native side and useIsFocused to work correctly.
function DelayedFreeze({
  freeze,
  children
}) {
  // flag used for determining whether freeze should be enabled
  const [freezeState, setFreezeState] = React.useState(false);
  React.useEffect(() => {
    const id = setImmediate(() => {
      setFreezeState(freeze);
    });
    return () => {
      clearImmediate(id);
    };
  }, [freeze]);
  return /*#__PURE__*/React.createElement(Freeze, {
    freeze: freeze ? freezeState : false
  }, children);
}
export default DelayedFreeze;
//# sourceMappingURL=DelayedFreeze.js.map