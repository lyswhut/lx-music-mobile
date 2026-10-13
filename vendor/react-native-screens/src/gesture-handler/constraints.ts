import { ScreenTransition } from 'react-native-reanimated';
import {
  AnimatedScreenTransition,
  GoBackGesture,
  PanGestureHandlerEventPayload,
} from '../native-stack/types';
import { AnimationForGesture } from './defaults';
import { GestureUpdateEvent } from 'react-native-gesture-handler';

const SupportedGestures = [
  'swipeRight',
  'swipeLeft',
  'swipeDown',
  'swipeUp',
  'horizontalSwipe',
  'verticalSwipe',
  'twoDimensionalSwipe',
];

export function getAnimationForTransition(
  goBackGesture: GoBackGesture | undefined,
  customTransitionAnimation: AnimatedScreenTransition | undefined,
) {
  let transitionAnimation = ScreenTransition.SwipeRight;
  if (customTransitionAnimation) {
    transitionAnimation = customTransitionAnimation;
    if (!goBackGesture) {
      throw new Error(
        '[RNScreens] You have to specify `goBackGesture` when using `transitionAnimation`.',
      );
    }
  } else {
    if (!!goBackGesture && SupportedGestures.includes(goBackGesture)) {
      transitionAnimation = AnimationForGesture[goBackGesture];
    } else if (goBackGesture !== undefined) {
      throw new Error(
        `[RNScreens] Unknown goBackGesture parameter has been specified: ${goBackGesture}.`,
      );
    }
  }
  return transitionAnimation;
}

export function checkBoundaries(
  goBackGesture: string | undefined,
  event: GestureUpdateEvent<PanGestureHandlerEventPayload>,
) {
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

export function checkIfTransitionCancelled(
  goBackGesture: string | undefined,
  distanceX: number,
  requiredXDistance: number,
  distanceY: number,
  requiredYDistance: number,
) {
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
