import React from 'react';
import { Platform, View } from 'react-native';

// Native components
import FullWindowOverlayNativeComponent from '../fabric/FullWindowOverlayNativeComponent';
const NativeFullWindowOverlay = FullWindowOverlayNativeComponent;
function FullWindowOverlay(props) {
  if (Platform.OS !== 'ios') {
    console.warn('Using FullWindowOverlay is only valid on iOS devices.');
    return /*#__PURE__*/React.createElement(View, props);
  }
  return /*#__PURE__*/React.createElement(NativeFullWindowOverlay, {
    style: {
      position: 'absolute',
      width: '100%',
      height: '100%'
    }
  }, props.children);
}
export default FullWindowOverlay;
//# sourceMappingURL=FullWindowOverlay.js.map