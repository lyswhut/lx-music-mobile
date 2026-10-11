import * as React from 'react';
import { Animated, Platform, StyleSheet, View, ViewProps } from 'react-native';
// @ts-ignore Getting private component
// eslint-disable-next-line import/no-named-as-default, import/default, import/no-named-as-default-member, import/namespace
import AppContainer from 'react-native/Libraries/ReactNative/AppContainer';
import warnOnce from 'warn-once';
import {
  ScreenStack,
  StackPresentationTypes,
  ScreenContext,
  GHContext,
  GestureDetectorBridge,
} from 'react-native-screens';
import {
  ParamListBase,
  StackActions,
  StackNavigationState,
  useTheme,
  Route,
  NavigationState,
  PartialState,
} from '@react-navigation/native';
import {
  useSafeAreaFrame,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  NativeStackDescriptorMap,
  NativeStackNavigationHelpers,
  NativeStackNavigationOptions,
  NativeStackNavigatorProps,
  ScreensRefsHolder,
} from '../types';
import HeaderConfig from './HeaderConfig';
import SafeAreaProviderCompat from '../utils/SafeAreaProviderCompat';
import getDefaultHeaderHeight from '../utils/getDefaultHeaderHeight';
import getStatusBarHeight from '../utils/getStatusBarHeight';
import HeaderHeightContext from '../utils/HeaderHeightContext';
import AnimatedHeaderHeightContext from '../utils/AnimatedHeaderHeightContext';

const isAndroid = Platform.OS === 'android';

let Container = View;

if (__DEV__) {
  const DebugContainer = (
    props: ViewProps & { stackPresentation: StackPresentationTypes },
  ) => {
    const { stackPresentation, ...rest } = props;
    if (Platform.OS === 'ios' && stackPresentation !== 'push') {
      return (
        <AppContainer>
          <View {...rest} />
        </AppContainer>
      );
    }
    return <View {...rest} />;
  };
  // @ts-ignore Wrong props
  Container = DebugContainer;
}

const MaybeNestedStack = ({
  options,
  route,
  stackPresentation,
  children,
}: {
  options: NativeStackNavigationOptions;
  route: Route<string>;
  stackPresentation: StackPresentationTypes;
  children: React.ReactNode;
}) => {
  const { colors } = useTheme();
  const { headerShown = true, contentStyle } = options;

  const Screen = React.useContext(ScreenContext);

  const isHeaderInModal = isAndroid
    ? false
    : stackPresentation !== 'push' && headerShown === true;

  const headerShownPreviousRef = React.useRef(headerShown);

  React.useEffect(() => {
    warnOnce(
      !isAndroid &&
        stackPresentation !== 'push' &&
        headerShownPreviousRef.current !== headerShown,
      `Dynamically changing 'headerShown' in modals will result in remounting the screen and losing all local state. See options for the screen '${route.name}'.`,
    );

    headerShownPreviousRef.current = headerShown;
  }, [headerShown, stackPresentation, route.name]);

  const content = (
    <Container
      style={[
        styles.container,
        stackPresentation !== 'transparentModal' &&
          stackPresentation !== 'containedTransparentModal' && {
            backgroundColor: colors.background,
          },
        contentStyle,
      ]}
      // @ts-ignore Wrong props passed to View
      stackPresentation={stackPresentation}
      // This view must *not* be flattened.
      // See https://github.com/software-mansion/react-native-screens/pull/1825
      // for detailed explanation.
      collapsable={false}>
      {children}
    </Container>
  );

  const dimensions = useSafeAreaFrame();
  const topInset = useSafeAreaInsets().top;
  const isStatusBarTranslucent = options.statusBarTranslucent ?? false;
  const statusBarHeight = getStatusBarHeight(
    topInset,
    dimensions,
    isStatusBarTranslucent,
  );

  const hasLargeHeader = options.headerLargeTitle ?? false;

  const headerHeight = getDefaultHeaderHeight(
    dimensions,
    statusBarHeight,
    stackPresentation,
    hasLargeHeader,
  );

  if (isHeaderInModal) {
    return (
      <ScreenStack style={styles.container}>
        <Screen
          enabled
          isNativeStack
          hasLargeHeader={hasLargeHeader}
          style={StyleSheet.absoluteFill}>
          <HeaderHeightContext.Provider value={headerHeight}>
            <HeaderConfig {...options} route={route} />
            {content}
          </HeaderHeightContext.Provider>
        </Screen>
      </ScreenStack>
    );
  }
  return content;
};

type NavigationRoute<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList,
> = Route<Extract<RouteName, string>, ParamList[RouteName]> & {
  state?: NavigationState | PartialState<NavigationState>;
};

const RouteView = ({
  descriptors,
  route,
  index,
  navigation,
  stateKey,
  screensRefs,
}: {
  descriptors: NativeStackDescriptorMap;
  route: NavigationRoute<ParamListBase, string>;
  index: number;
  navigation: NativeStackNavigationHelpers;
  stateKey: string;
  screensRefs: ScreensRefsHolder;
}) => {
  const { options, render: renderScene } = descriptors[route.key];
  const {
    fullScreenSwipeShadowEnabled = false,
    gestureEnabled,
    headerShown,
    hideKeyboardOnSwipe,
    homeIndicatorHidden,
    sheetAllowedDetents = 'large',
    sheetLargestUndimmedDetent = 'all',
    sheetGrabberVisible = false,
    sheetCornerRadius = -1.0,
    sheetExpandsWhenScrolledToEdge = true,
    nativeBackButtonDismissalEnabled = false,
    navigationBarColor,
    navigationBarTranslucent,
    navigationBarHidden,
    replaceAnimation = 'pop',
    screenOrientation,
    statusBarAnimation,
    statusBarColor,
    statusBarHidden,
    statusBarStyle,
    statusBarTranslucent,
    swipeDirection = 'horizontal',
    transitionDuration,
    freezeOnBlur,
  } = options;

  let {
    customAnimationOnSwipe,
    fullScreenSwipeEnabled,
    gestureResponseDistance,
    stackAnimation,
    stackPresentation = 'push',
  } = options;

  if (swipeDirection === 'vertical') {
    // for `vertical` direction to work, we need to set `fullScreenSwipeEnabled` to `true`
    // so the screen can be dismissed from any point on screen.
    // `customAnimationOnSwipe` needs to be set to `true` so the `stackAnimation` set by user can be used,
    // otherwise `simple_push` will be used.
    // Also, the default animation for this direction seems to be `slide_from_bottom`.
    if (fullScreenSwipeEnabled === undefined) {
      fullScreenSwipeEnabled = true;
    }
    if (customAnimationOnSwipe === undefined) {
      customAnimationOnSwipe = true;
    }
    if (stackAnimation === undefined) {
      stackAnimation = 'slide_from_bottom';
    }
  }

  if (index === 0) {
    // first screen should always be treated as `push`, it resolves problems with no header animation
    // for navigator with first screen as `modal` and the next as `push`
    stackPresentation = 'push';
  }

  const dimensions = useSafeAreaFrame();
  const topInset = useSafeAreaInsets().top;
  const isStatusBarTranslucent = options.statusBarTranslucent ?? false;
  const statusBarHeight = getStatusBarHeight(
    topInset,
    dimensions,
    isStatusBarTranslucent,
  );

  const hasLargeHeader = options.headerLargeTitle ?? false;

  const defaultHeaderHeight = getDefaultHeaderHeight(
    dimensions,
    statusBarHeight,
    stackPresentation,
    hasLargeHeader,
  );

  const parentHeaderHeight = React.useContext(HeaderHeightContext);
  const isHeaderInPush = isAndroid
    ? headerShown
    : stackPresentation === 'push' && headerShown !== false;

  const staticHeaderHeight =
    isHeaderInPush !== false ? defaultHeaderHeight : parentHeaderHeight ?? 0;

  // We need to ensure the first retrieved header height will be cached and set in animatedHeaderHeight.
  // We're caching the header height here, as on iOS native side events are not always coming to the JS on first notify.
  // TODO: Check why first event is not being received once it is cached on the native side.
  const cachedAnimatedHeaderHeight = React.useRef(defaultHeaderHeight);
  const animatedHeaderHeight = React.useRef(
    new Animated.Value(staticHeaderHeight, {
      useNativeDriver: true,
    }),
  ).current;

  const Screen = React.useContext(ScreenContext);
  const { dark } = useTheme();

  const screenRef = React.useRef(null);
  React.useEffect(() => {
    screensRefs.current[route.key] = screenRef;
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete screensRefs.current[route.key];
    };
  });

  return (
    <Screen
      key={route.key}
      ref={screenRef}
      enabled
      isNativeStack
      hasLargeHeader={hasLargeHeader}
      style={StyleSheet.absoluteFill}
      sheetAllowedDetents={sheetAllowedDetents}
      sheetLargestUndimmedDetent={sheetLargestUndimmedDetent}
      sheetGrabberVisible={sheetGrabberVisible}
      sheetCornerRadius={sheetCornerRadius}
      sheetExpandsWhenScrolledToEdge={sheetExpandsWhenScrolledToEdge}
      customAnimationOnSwipe={customAnimationOnSwipe}
      freezeOnBlur={freezeOnBlur}
      fullScreenSwipeEnabled={fullScreenSwipeEnabled}
      fullScreenSwipeShadowEnabled={fullScreenSwipeShadowEnabled}
      hideKeyboardOnSwipe={hideKeyboardOnSwipe}
      homeIndicatorHidden={homeIndicatorHidden}
      gestureEnabled={isAndroid ? false : gestureEnabled}
      gestureResponseDistance={gestureResponseDistance}
      nativeBackButtonDismissalEnabled={nativeBackButtonDismissalEnabled}
      navigationBarColor={navigationBarColor}
      navigationBarTranslucent={navigationBarTranslucent}
      navigationBarHidden={navigationBarHidden}
      replaceAnimation={replaceAnimation}
      screenOrientation={screenOrientation}
      stackAnimation={stackAnimation}
      stackPresentation={stackPresentation}
      statusBarAnimation={statusBarAnimation}
      statusBarColor={statusBarColor}
      statusBarHidden={statusBarHidden}
      statusBarStyle={statusBarStyle ?? (dark ? 'light' : 'dark')}
      statusBarTranslucent={statusBarTranslucent}
      swipeDirection={swipeDirection}
      transitionDuration={transitionDuration}
      onHeaderBackButtonClicked={() => {
        navigation.dispatch({
          ...StackActions.pop(),
          source: route.key,
          target: stateKey,
        });
      }}
      onWillAppear={() => {
        navigation.emit({
          type: 'transitionStart',
          data: { closing: false },
          target: route.key,
        });
      }}
      onWillDisappear={() => {
        navigation.emit({
          type: 'transitionStart',
          data: { closing: true },
          target: route.key,
        });
      }}
      onAppear={() => {
        navigation.emit({
          type: 'appear',
          target: route.key,
        });
        navigation.emit({
          type: 'transitionEnd',
          data: { closing: false },
          target: route.key,
        });
      }}
      onDisappear={() => {
        navigation.emit({
          type: 'transitionEnd',
          data: { closing: true },
          target: route.key,
        });
      }}
      onHeaderHeightChange={e => {
        const headerHeight = e.nativeEvent.headerHeight;

        if (cachedAnimatedHeaderHeight.current !== headerHeight) {
          // Currently, we're setting value by Animated#setValue, because we want to cache animated value.
          // Also, in React Native 0.72 there was a bug on Fabric causing a large delay between the screen transition,
          // which should not occur.
          // TODO: Check if it's possible to replace animated#setValue to Animated#event.
          animatedHeaderHeight.setValue(headerHeight);
          cachedAnimatedHeaderHeight.current = headerHeight;
        }
      }}
      onDismissed={e => {
        navigation.emit({
          type: 'dismiss',
          target: route.key,
        });

        const dismissCount =
          e.nativeEvent.dismissCount > 0 ? e.nativeEvent.dismissCount : 1;

        navigation.dispatch({
          ...StackActions.pop(dismissCount),
          source: route.key,
          target: stateKey,
        });
      }}
      onGestureCancel={() => {
        navigation.emit({
          type: 'gestureCancel',
          target: route.key,
        });
      }}>
      <AnimatedHeaderHeightContext.Provider value={animatedHeaderHeight}>
        <HeaderHeightContext.Provider value={staticHeaderHeight}>
          <MaybeNestedStack
            options={options}
            route={route}
            stackPresentation={stackPresentation}>
            {renderScene()}
          </MaybeNestedStack>
          {/* HeaderConfig must not be first child of a Screen.
           See https://github.com/software-mansion/react-native-screens/pull/1825
           for detailed explanation */}
          <HeaderConfig
            {...options}
            route={route}
            headerShown={isHeaderInPush}
          />
        </HeaderHeightContext.Provider>
      </AnimatedHeaderHeightContext.Provider>
    </Screen>
  );
};

type Props = {
  state: StackNavigationState<ParamListBase>;
  navigation: NativeStackNavigationHelpers;
  descriptors: NativeStackDescriptorMap;
};

function NativeStackViewInner({
  state,
  navigation,
  descriptors,
}: Props): JSX.Element {
  const { key, routes } = state;

  const currentRouteKey = routes[state.index].key;
  const { goBackGesture, transitionAnimation, screenEdgeGesture } =
    descriptors[currentRouteKey].options;
  const gestureDetectorBridge = React.useRef<GestureDetectorBridge>({
    stackUseEffectCallback: _stackRef => {
      // this method will be override in GestureDetector
    },
  });
  type RefHolder = Record<
    string,
    React.MutableRefObject<React.Ref<NativeStackNavigatorProps>>
  >;
  const screensRefs = React.useRef<RefHolder>({});
  const ScreenGestureDetector = React.useContext(GHContext);

  React.useEffect(() => {
    if (
      ScreenGestureDetector.name !== 'GHWrapper' &&
      goBackGesture !== undefined
    ) {
      console.warn(
        'Cannot detect GestureDetectorProvider in a screen that uses `goBackGesture`. Make sure your navigator is wrapped in GestureDetectorProvider.',
      );
    }
  }, [ScreenGestureDetector.name, goBackGesture]);

  return (
    <ScreenGestureDetector
      gestureDetectorBridge={gestureDetectorBridge}
      goBackGesture={goBackGesture}
      transitionAnimation={transitionAnimation}
      screenEdgeGesture={screenEdgeGesture ?? false}
      screensRefs={screensRefs}
      currentRouteKey={currentRouteKey}>
      <ScreenStack
        style={styles.container}
        gestureDetectorBridge={gestureDetectorBridge}>
        {routes.map((route, index) => (
          <RouteView
            key={route.key}
            descriptors={descriptors}
            route={route}
            index={index}
            navigation={navigation}
            stateKey={key}
            screensRefs={screensRefs}
          />
        ))}
      </ScreenStack>
    </ScreenGestureDetector>
  );
}

export default function NativeStackView(props: Props) {
  return (
    <SafeAreaProviderCompat>
      <NativeStackViewInner {...props} />
    </SafeAreaProviderCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
