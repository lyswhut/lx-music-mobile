import {
  createNavigatorFactory,
  EventArg,
  StackActions,
  StackActionHelpers,
  StackNavigationState,
  StackRouter,
  StackRouterOptions,
  ParamListBase,
  useNavigationBuilder,
} from '@react-navigation/native';
import * as React from 'react';
import {
  NativeStackNavigationEventMap,
  NativeStackNavigationOptions,
  NativeStackNavigatorProps,
} from '../types';
import NativeStackView from '../views/NativeStackView';

function NativeStackNavigator({
  initialRouteName,
  children,
  screenOptions,
  ...rest
}: NativeStackNavigatorProps) {
  const { state, descriptors, navigation } = useNavigationBuilder<
    StackNavigationState<ParamListBase>,
    StackRouterOptions,
    StackActionHelpers<ParamListBase>,
    NativeStackNavigationOptions,
    NativeStackNavigationEventMap
  >(StackRouter, {
    initialRouteName,
    children,
    screenOptions,
  });

  // Starting from React Navigation v6, `native-stack` should be imported from
  // `@react-navigation/native-stack` rather than `react-native-screens/native-stack`
  React.useEffect(() => {
    // @ts-ignore navigation.dangerouslyGetParent was removed in v6
    if (navigation?.dangerouslyGetParent === undefined) {
      console.warn(
        'Looks like you are importing `native-stack` from `react-native-screens/native-stack`. Since version 6 of `react-navigation`, it should be imported from `@react-navigation/native-stack`.',
      );
    }
  }, [navigation]);

  React.useEffect(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigation as typeof navigation & { addListener: any })?.addListener?.(
        'tabPress',
        (e: any) => {
          const isFocused = navigation.isFocused();

          // Run the operation in the next frame so we're sure all listeners have been run
          // This is necessary to know if preventDefault() has been called
          requestAnimationFrame(() => {
            if (
              state.index > 0 &&
              isFocused &&
              !(e as EventArg<'tabPress', true>).defaultPrevented
            ) {
              // When user taps on already focused tab and we're inside the tab,
              // reset the stack to replicate native behaviour
              navigation.dispatch({
                ...StackActions.popToTop(),
                target: state.key,
              });
            }
          });
        },
      ),
    [navigation, state.index, state.key],
  );

  return (
    <NativeStackView
      {...rest}
      state={state}
      navigation={navigation}
      descriptors={descriptors}
    />
  );
}

export default createNavigatorFactory<
  StackNavigationState<ParamListBase>,
  NativeStackNavigationOptions,
  NativeStackNavigationEventMap,
  typeof NativeStackNavigator
>(NativeStackNavigator);
