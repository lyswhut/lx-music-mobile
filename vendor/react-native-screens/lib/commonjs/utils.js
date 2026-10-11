"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.executeNativeBackPress = executeNativeBackPress;
exports.isSearchBarAvailableForCurrentPlatform = exports.isNewBackTitleImplementation = void 0;
var _reactNative = require("react-native");
const isSearchBarAvailableForCurrentPlatform = exports.isSearchBarAvailableForCurrentPlatform = ['ios', 'android'].includes(_reactNative.Platform.OS);
function executeNativeBackPress() {
  // This function invokes the native back press event
  _reactNative.BackHandler.exitApp();
  return true;
}

// Because of a bug introduced in https://github.com/software-mansion/react-native-screens/pull/1646
// react-native-screens v3.21 changed how header's backTitle handles whitespace strings in https://github.com/software-mansion/react-native-screens/pull/1726
// To allow for backwards compatibility in @react-navigation/native-stack we need a way to check if this version or newer is used.
// See https://github.com/react-navigation/react-navigation/pull/11423 for more context.
const isNewBackTitleImplementation = exports.isNewBackTitleImplementation = true;
//# sourceMappingURL=utils.js.map