import { Platform, UIManager } from 'react-native';

// const that tells if the library should use new implementation, will be undefined for older versions
export const shouldUseActivityState = true;

export const isNativePlatformSupported =
  Platform.OS === 'ios' ||
  Platform.OS === 'android' ||
  Platform.OS === 'windows';

let ENABLE_SCREENS = isNativePlatformSupported;

export function enableScreens(shouldEnableScreens = true) {
  ENABLE_SCREENS = shouldEnableScreens;

  if (!isNativePlatformSupported) {
    return;
  }

  if (ENABLE_SCREENS && !UIManager.getViewManagerConfig('RNSScreen')) {
    console.error(
      `Screen native module hasn't been linked. Please check the react-native-screens README for more details`,
    );
  }
}

let ENABLE_FREEZE = false;

export function enableFreeze(shouldEnableReactFreeze = true) {
  if (!isNativePlatformSupported) {
    return;
  }

  ENABLE_FREEZE = shouldEnableReactFreeze;
}

export function screensEnabled() {
  return ENABLE_SCREENS;
}

export function freezeEnabled() {
  return ENABLE_FREEZE;
}
