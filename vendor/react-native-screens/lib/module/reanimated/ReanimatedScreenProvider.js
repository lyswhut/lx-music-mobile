function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
import React from 'react';
import { ScreenContext } from 'react-native-screens';
import ReanimatedNativeStackScreen from './ReanimatedNativeStackScreen';
import AnimatedScreen from './ReanimatedScreen';
class ReanimatedScreenWrapper extends React.Component {
  ref = null;
  setNativeProps(props) {
    this.ref?.setNativeProps(props);
  }
  setRef = ref => {
    this.ref = ref;
    this.props.onComponentRef?.(ref);
  };
  render() {
    const ReanimatedScreen = this.props.isNativeStack ? ReanimatedNativeStackScreen : AnimatedScreen;
    return /*#__PURE__*/React.createElement(ReanimatedScreen, _extends({}, this.props, {
      // @ts-ignore some problems with ref
      ref: this.setRef
    }));
  }
}
export default function ReanimatedScreenProvider(props) {
  return (
    /*#__PURE__*/
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React.createElement(ScreenContext.Provider, {
      value: ReanimatedScreenWrapper
    }, props.children)
  );
}
//# sourceMappingURL=ReanimatedScreenProvider.js.map