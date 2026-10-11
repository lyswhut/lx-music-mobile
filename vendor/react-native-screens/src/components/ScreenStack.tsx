import React from 'react';
import { ScreenStackProps, freezeEnabled } from 'react-native-screens';
import DelayedFreeze from './helpers/DelayedFreeze';

// Native components
import ScreenStackNativeComponent from '../fabric/ScreenStackNativeComponent';
const NativeScreenStack: React.ComponentType<ScreenStackProps> =
  ScreenStackNativeComponent as any;

function isFabric() {
  return 'nativeFabricUIManager' in global;
}

function ScreenStack(props: ScreenStackProps) {
  const { children, gestureDetectorBridge, ...rest } = props;
  const ref = React.useRef(null);
  const size = React.Children.count(children);
  // freezes all screens except the top one
  const childrenWithFreeze = React.Children.map(children, (child, index) => {
    // @ts-expect-error it's either SceneView in v6 or RouteView in v5
    const { props, key } = child;
    const descriptor = props?.descriptor ?? props?.descriptors?.[key];
    const isFreezeEnabled =
      descriptor?.options?.freezeOnBlur ?? freezeEnabled();

    // On Fabric, when screen is frozen, animated and reanimated values are not updated
    // due to component being unmounted. To avoid this, we don't freeze the previous screen there
    const freezePreviousScreen = isFabric()
      ? size - index > 2
      : size - index > 1;

    return (
      <DelayedFreeze freeze={isFreezeEnabled && freezePreviousScreen}>
        {child}
      </DelayedFreeze>
    );
  });

  React.useEffect(() => {
    if (gestureDetectorBridge) {
      gestureDetectorBridge.current.stackUseEffectCallback(ref);
    }
  });
  return (
    <NativeScreenStack {...rest} ref={ref}>
      {childrenWithFreeze}
    </NativeScreenStack>
  );
}

export default ScreenStack;
