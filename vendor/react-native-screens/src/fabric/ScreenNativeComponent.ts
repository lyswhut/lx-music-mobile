import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import type { ViewProps, ColorValue } from 'react-native';
import type {
  DirectEventHandler,
  WithDefault,
  Int32,
  Float,
  Double,
} from 'react-native/Libraries/Types/CodegenTypes';

// eslint-disable-next-line @typescript-eslint/ban-types
type ScreenEvent = Readonly<{}>;

type ScreenDismissedEvent = Readonly<{
  dismissCount: Int32;
}>;

type TransitionProgressEvent = Readonly<{
  progress: Double;
  closing: Int32;
  goingForward: Int32;
}>;

type HeaderHeightChangeEvent = Readonly<{
  headerHeight: Double;
}>;

type GestureResponseDistanceType = Readonly<{
  start: Float;
  end: Float;
  top: Float;
  bottom: Float;
}>;

type StackPresentation =
  | 'push'
  | 'modal'
  | 'transparentModal'
  | 'fullScreenModal'
  | 'formSheet'
  | 'containedModal'
  | 'containedTransparentModal';

type StackAnimation =
  | 'default'
  | 'flip'
  | 'simple_push'
  | 'none'
  | 'fade'
  | 'slide_from_right'
  | 'slide_from_left'
  | 'slide_from_bottom'
  | 'fade_from_bottom'
  | 'ios';

type SwipeDirection = 'vertical' | 'horizontal';

type ReplaceAnimation = 'pop' | 'push';

type SheetDetentTypes = 'large' | 'medium' | 'all';

export interface NativeProps extends ViewProps {
  onAppear?: DirectEventHandler<ScreenEvent>;
  onDisappear?: DirectEventHandler<ScreenEvent>;
  onDismissed?: DirectEventHandler<ScreenDismissedEvent>;
  onNativeDismissCancelled?: DirectEventHandler<ScreenDismissedEvent>;
  onWillAppear?: DirectEventHandler<ScreenEvent>;
  onWillDisappear?: DirectEventHandler<ScreenEvent>;
  onHeaderHeightChange?: DirectEventHandler<HeaderHeightChangeEvent>;
  onTransitionProgress?: DirectEventHandler<TransitionProgressEvent>;
  onGestureCancel?: DirectEventHandler<ScreenEvent>;
  onHeaderBackButtonClicked?: DirectEventHandler<ScreenEvent>;
  sheetAllowedDetents?: WithDefault<SheetDetentTypes, 'large'>;
  sheetLargestUndimmedDetent?: WithDefault<SheetDetentTypes, 'all'>;
  sheetGrabberVisible?: WithDefault<boolean, false>;
  sheetCornerRadius?: WithDefault<Float, -1.0>;
  sheetExpandsWhenScrolledToEdge?: WithDefault<boolean, false>;
  customAnimationOnSwipe?: boolean;
  fullScreenSwipeEnabled?: boolean;
  fullScreenSwipeShadowEnabled?: boolean;
  homeIndicatorHidden?: boolean;
  preventNativeDismiss?: boolean;
  gestureEnabled?: WithDefault<boolean, true>;
  statusBarColor?: ColorValue;
  statusBarHidden?: boolean;
  screenOrientation?: string;
  statusBarAnimation?: string;
  statusBarStyle?: string;
  statusBarTranslucent?: boolean;
  gestureResponseDistance?: GestureResponseDistanceType;
  stackPresentation?: WithDefault<StackPresentation, 'push'>;
  stackAnimation?: WithDefault<StackAnimation, 'default'>;
  transitionDuration?: WithDefault<Int32, 350>;
  replaceAnimation?: WithDefault<ReplaceAnimation, 'pop'>;
  swipeDirection?: WithDefault<SwipeDirection, 'horizontal'>;
  hideKeyboardOnSwipe?: boolean;
  activityState?: WithDefault<Float, -1.0>;
  navigationBarColor?: ColorValue;
  navigationBarTranslucent?: boolean;
  navigationBarHidden?: boolean;
  nativeBackButtonDismissalEnabled?: boolean;
}

export default codegenNativeComponent<NativeProps>('RNSScreen', {
  interfaceOnly: true,
});
