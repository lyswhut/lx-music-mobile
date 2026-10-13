import { Platform } from 'react-native';
export default function getStatusBarHeight(topInset, dimensions, isStatusBarTranslucent) {
  if (Platform.OS === 'ios') {
    // It looks like some iOS devices don't have strictly set status bar height to 44.
    // Thus, if the top inset is higher than 50, then the device should have a dynamic island.
    // On models with Dynamic Island the status bar height is smaller than the safe area top inset by 5 pixels.
    // See https://developer.apple.com/forums/thread/662466 for more details about status bar height.
    const hasDynamicIsland = topInset > 50;
    return hasDynamicIsland ? topInset - 5 : topInset;
  } else if (Platform.OS === 'android') {
    // On Android we should also rely on frame's y-axis position, as topInset is 0 on visible status bar.
    return isStatusBarTranslucent ? topInset : dimensions.y;
  }
  return topInset;
}
//# sourceMappingURL=getStatusBarHeight.js.map