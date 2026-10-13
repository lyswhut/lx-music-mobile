import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import type { ViewProps } from 'react-native';
import type { WithDefault } from 'react-native/Libraries/Types/CodegenTypes';

export type HeaderSubviewTypes =
  | 'back'
  | 'right'
  | 'left'
  | 'title'
  | 'center'
  | 'searchBar';

export interface NativeProps extends ViewProps {
  type?: WithDefault<HeaderSubviewTypes, 'left'>;
}

export default codegenNativeComponent<NativeProps>(
  'RNSScreenStackHeaderSubview',
  {},
);
