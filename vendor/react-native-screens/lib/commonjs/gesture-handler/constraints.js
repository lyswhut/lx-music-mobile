"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.checkBoundaries = checkBoundaries;
exports.checkIfTransitionCancelled = checkIfTransitionCancelled;
exports.getAnimationForTransition = getAnimationForTransition;
var _reactNativeReanimated = require("react-native-reanimated");
var _defaults = require("./defaults");
const SupportedGestures = ['swipeRight', 'swipeLeft', 'swipeDown', 'swipeUp', 'horizontalSwipe', 'verticalSwipe', 'twoDimensionalSwipe'];
function getAnimationForTransition(goBackGesture, customTransitionAnimation) {
  let transitionAnimation = _reactNativeReanimated.ScreenTransition.SwipeRight;
  if (customTransitionAnimation) {
    transitionAnimation = customTransitionAnimation;
    if (!goBackGesture) {
      throw new Error('[RNScreens] You have to specify `goBackGesture` when using `transitionAnimation`.');
    }
  } else {
    if (!!goBackGesture && SupportedGestures.includes(goBackGesture)) {
      transitionAnimation = _defaults.AnimationForGesture[goBackGesture];
    } else if (goBackGesture !== undefined) {
      throw new Error(`[RNScreens] Unknown goBackGesture parameter has been specified: ${goBackGesture}.`);
    }
  }
  return transitionAnimation;
}
function checkBoundaries(goBackGesture, event) {
  'worklet';

  if (goBackGesture === 'swipeRight' && event.translationX < 0) {
    event.translationX = 0;
  } else if (goBackGesture === 'swipeLeft' && event.translationX > 0) {
    event.translationX = 0;
  } else if (goBackGesture === 'swipeDown' && event.translationY < 0) {
    event.translationY = 0;
  } else if (goBackGesture === 'swipeUp' && event.translationY > 0) {
    event.translationY = 0;
  }
}
function checkIfTransitionCancelled(goBackGesture, distanceX, requiredXDistance, distanceY, requiredYDistance) {
  'worklet';

  let isTransitionCanceled = false;
  if (goBackGesture === 'swipeRight') {
    isTransitionCanceled = distanceX < requiredXDistance;
  } else if (goBackGesture === 'swipeLeft') {
    isTransitionCanceled = -distanceX < requiredXDistance;
  } else if (goBackGesture === 'horizontalSwipe') {
    isTransitionCanceled = Math.abs(distanceX) < requiredXDistance;
  } else if (goBackGesture === 'swipeUp') {
    isTransitionCanceled = -distanceY < requiredYDistance;
  } else if (goBackGesture === 'swipeDown') {
    isTransitionCanceled = distanceY < requiredYDistance;
  } else if (goBackGesture === 'verticalSwipe') {
    isTransitionCanceled = Math.abs(distanceY) < requiredYDistance;
  } else if (goBackGesture === 'twoDimensionalSwipe') {
    const isCanceledHorizontally = Math.abs(distanceX) < requiredXDistance;
    const isCanceledVertically = Math.abs(distanceY) < requiredYDistance;
    isTransitionCanceled = isCanceledHorizontally && isCanceledVertically;
  }
  return isTransitionCanceled;
}
//# sourceMappingURL=constraints.js.map