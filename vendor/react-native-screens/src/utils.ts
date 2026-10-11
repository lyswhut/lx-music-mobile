import { BackHandler, Platform } from 'react-native';

export const isSearchBarAvailableForCurrentPlatform = [
  'ios',
  'android',
].includes(Platform.OS);

export function executeNativeBackPress() {
  // This function invokes the native back press event
  BackHandler.exitApp();
  return true;
}

// Because of a bug introduced in https://github.com/software-mansion/react-native-screens/pull/1646
// react-native-screens v3.21 changed how header's backTitle handles whitespace strings in https://github.com/software-mansion/react-native-screens/pull/1726
// To allow for backwards compatibility in @react-navigation/native-stack we need a way to check if this version or newer is used.
// See https://github.com/react-navigation/react-navigation/pull/11423 for more context.
export const isNewBackTitleImplementation = true;
