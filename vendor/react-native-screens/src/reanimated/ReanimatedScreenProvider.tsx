import React, { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { ScreenProps, ScreenContext } from 'react-native-screens';
import ReanimatedNativeStackScreen from './ReanimatedNativeStackScreen';
import AnimatedScreen from './ReanimatedScreen';

class ReanimatedScreenWrapper extends React.Component<ScreenProps> {
  private ref: React.ElementRef<typeof View> | null = null;

  setNativeProps(props: ScreenProps): void {
    this.ref?.setNativeProps(props);
  }

  setRef = (ref: React.ElementRef<typeof View> | null): void => {
    this.ref = ref;
    this.props.onComponentRef?.(ref);
  };

  render() {
    const ReanimatedScreen = this.props.isNativeStack
      ? ReanimatedNativeStackScreen
      : AnimatedScreen;
    return (
      <ReanimatedScreen
        {...this.props}
        // @ts-ignore some problems with ref
        ref={this.setRef}
      />
    );
  }
}

export default function ReanimatedScreenProvider(
  props: PropsWithChildren<unknown>,
) {
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <ScreenContext.Provider value={ReanimatedScreenWrapper as any}>
      {props.children}
    </ScreenContext.Provider>
  );
}
