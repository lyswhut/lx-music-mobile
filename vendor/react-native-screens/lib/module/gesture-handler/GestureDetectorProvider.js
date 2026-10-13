import React from 'react';
import { GHContext } from 'react-native-screens';
import ScreenGestureDetector from './ScreenGestureDetector';
function GHWrapper(props) {
  return /*#__PURE__*/React.createElement(ScreenGestureDetector, props);
}
export default function GestureDetectorProvider(props) {
  return /*#__PURE__*/React.createElement(GHContext.Provider, {
    value: GHWrapper
  }, props.children);
}
//# sourceMappingURL=GestureDetectorProvider.js.map