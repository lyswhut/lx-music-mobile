"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getDefaultHeaderHeight;
var _reactNative = require("react-native");
const formSheetModalHeight = 56;
function getDefaultHeaderHeight(layout, statusBarHeight, stackPresentation, isLargeHeader = false) {
  // default header heights
  let headerHeight = _reactNative.Platform.OS === 'android' ? 56 : 64;
  if (_reactNative.Platform.OS === 'ios') {
    const isLandscape = layout.width > layout.height;
    const isFormSheetModal = stackPresentation === 'modal' || stackPresentation === 'formSheet';
    if (isFormSheetModal && !isLandscape) {
      // `modal` and `formSheet` presentations do not take whole screen, so should not take the inset.
      statusBarHeight = 0;
    }
    if (_reactNative.Platform.isPad || _reactNative.Platform.isTV) {
      headerHeight = isFormSheetModal ? formSheetModalHeight : 50;
    } else {
      if (isLandscape) {
        headerHeight = 32;
      } else {
        if (isFormSheetModal) {
          headerHeight = formSheetModalHeight;
        } else {
          headerHeight = isLargeHeader ? 96 : 44;
        }
      }
    }
  }
  return headerHeight + statusBarHeight;
}
//# sourceMappingURL=getDefaultHeaderHeight.js.map