import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import type { ViewProps, ColorValue } from 'react-native';
import type {
  Int32,
  WithDefault,
  DirectEventHandler,
} from 'react-native/Libraries/Types/CodegenTypes';

type DirectionType = 'rtl' | 'ltr';

// eslint-disable-next-line @typescript-eslint/ban-types
type OnAttachedEvent = Readonly<{}>;
// eslint-disable-next-line @typescript-eslint/ban-types
type OnDetachedEvent = Readonly<{}>;

type BackButtonDisplayMode = 'minimal' | 'default' | 'generic';

export interface NativeProps extends ViewProps {
  onAttached?: DirectEventHandler<OnAttachedEvent>;
  onDetached?: DirectEventHandler<OnDetachedEvent>;
  backgroundColor?: ColorValue;
  backTitle?: string;
  backTitleFontFamily?: string;
  backTitleFontSize?: Int32;
  backTitleVisible?: WithDefault<boolean, 'true'>;
  color?: ColorValue;
  direction?: WithDefault<DirectionType, 'ltr'>;
  hidden?: boolean;
  hideShadow?: boolean;
  largeTitle?: boolean;
  largeTitleFontFamily?: string;
  largeTitleFontSize?: Int32;
  largeTitleFontWeight?: string;
  largeTitleBackgroundColor?: ColorValue;
  largeTitleHideShadow?: boolean;
  largeTitleColor?: ColorValue;
  translucent?: boolean;
  title?: string;
  titleFontFamily?: string;
  titleFontSize?: Int32;
  titleFontWeight?: string;
  titleColor?: ColorValue;
  disableBackButtonMenu?: boolean;
  backButtonDisplayMode?: WithDefault<BackButtonDisplayMode, 'default'>;
  hideBackButton?: boolean;
  backButtonInCustomView?: boolean;
  // TODO: implement this props on iOS
  topInsetEnabled?: boolean;
}

export default codegenNativeComponent<NativeProps>(
  'RNSScreenStackHeaderConfig',
  {},
);
