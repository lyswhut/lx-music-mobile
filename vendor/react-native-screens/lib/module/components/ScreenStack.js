function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
import React from 'react';
import { freezeEnabled } from 'react-native-screens';
import DelayedFreeze from './helpers/DelayedFreeze';

// Native components
import ScreenStackNativeComponent from '../fabric/ScreenStackNativeComponent';
const NativeScreenStack = ScreenStackNativeComponent;
function isFabric() {
  return 'nativeFabricUIManager' in global;
}
function ScreenStack(props) {
  const {
    children,
    gestureDetectorBridge,
    ...rest
  } = props;
  const ref = React.useRef(null);
  const size = React.Children.count(children);
  // freezes all screens except the top one
  const childrenWithFreeze = React.Children.map(children, (child, index) => {
    // @ts-expect-error it's either SceneView in v6 or RouteView in v5
    const {
      props,
      key
    } = child;
    const descriptor = props?.descriptor ?? props?.descriptors?.[key];
    const isFreezeEnabled = descriptor?.options?.freezeOnBlur ?? freezeEnabled();

    // On Fabric, when screen is frozen, animated and reanimated values are not updated
    // due to component being unmounted. To avoid this, we don't freeze the previous screen there
    const freezePreviousScreen = isFabric() ? size - index > 2 : size - index > 1;
    return /*#__PURE__*/React.createElement(DelayedFreeze, {
      freeze: isFreezeEnabled && freezePreviousScreen
    }, child);
  });
  React.useEffect(() => {
    if (gestureDetectorBridge) {
      gestureDetectorBridge.current.stackUseEffectCallback(ref);
    }
  });
  return /*#__PURE__*/React.createElement(NativeScreenStack, _extends({}, rest, {
    ref: ref
  }), childrenWithFreeze);
}
export default ScreenStack;
//# sourceMappingURL=ScreenStack.js.map