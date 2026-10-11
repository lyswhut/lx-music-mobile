# Native Stack Navigator

> **_NOTE:_** This README is dedicated for using `native-stack` with React Navigation **v5**. For using `native-stack` in React Navigation **v6** please refer to the [Native Stack Navigator part of React Navigation documentation](https://reactnavigation.org/docs/native-stack-navigator).

Provides a way for your app to transition between screens where each new screen is placed on top of a stack.

By default the stack navigator is configured to have the familiar iOS and Android look & feel: new screens slide in from the right on iOS, fade in and scale from center on Android. On iOS, the stack navigator can also be configured to a modal style where screens slide in from the bottom.

This navigator uses native navigation primitives (`UINavigationController` on iOS and `Fragment` on Android) for navigation under the hood. The main difference from React Navigation's JS-based [stack navigator](https://reactnavigation.org/docs/stack-navigator.html) is that the JS-based navigator re-implements animations and gestures while the native stack navigator relies on the platform primitives for animations and gestures. You should use this navigator if you want native feeling and performance for navigation and don't need much customization, as the customization options of this navigator are limited.

```sh
npm install react-native-screens @react-navigation/native
```

## Disabling `react-native-screens`

If, for whatever reason, you'd like to disable native screens support and use plain React Native Views add the following code in your entry file (e.g. `App.js`):

```js
import { enableScreens } from 'react-native-screens';

enableScreens(false);
```

## API Definition

To use this navigator, import it from `react-native-screens/native-stack`:

```js
import { createNativeStackNavigator } from 'react-native-screens/native-stack';

const Stack = createNativeStackNavigator();

function MyStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="Notifications" component={Notifications} />
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="Settings" component={Settings} />
    </Stack.Navigator>
  );
}
```

### Props

The `Stack.Navigator` component accepts following props:

#### `initialRouteName`

The name of the route to render on the first load of the navigator.

#### `screenOptions`

Default options to use for the screens in the navigator.

### Options

The `options` prop can be used to configure individual screens inside the navigator. Supported options are:

#### `backButtonInCustomView`

Boolean indicating whether to hide the back button while using `headerLeft` function.

#### `contentStyle`

Style object for the scene content.

#### `customAnimationOnSwipe` (iOS only)

Boolean indicating that swipe dismissal should trigger animation provided by `stackAnimation`. Defaults to `false`.

#### `direction`

String that applies `rtl` or `ltr` form to the stack. On Android, you have to add `android:supportsRtl="true"` in the manifest of your app to enable `rtl`. On Android, if you set the above flag in the manifest, the orientation changes without the need to do it programmatically if the phone has `rtl` direction enabled. On iOS, the direction defaults to `ltr`, and only way to change it is via this prop.

#### `disableBackButtonMenu` (iOS only)

Boolean indicating whether to show the menu on longPress of iOS >= 14 back button.

#### `backButtonDisplayMode` (iOS only)

Enum value indicating display mode of **default** back button. It works on iOS >= 14, and is used only when none of: `backTitleFontFamily`, `backTitleFontSize`, `disableBackButtonMenu` or `backTitle` is set. Otherwise, when the button is customized, under the hood we use iOS native `backButtonItem` which overrides `backButtonDisplayMode`. Read more [#2123](https://github.com/software-mansion/react-native-screens/pull/2123). Possible options:

- `default` – show given back button previous controller title, system generic or just icon based on available space
- `generic` – show given system generic or just icon based on available space
- `minimal` – show just an icon

#### `fullScreenSwipeEnabled` (iOS only)

Boolean indicating whether the swipe gesture should work on whole screen. Swiping with this option results in the same transition animation as `simple_push` by default. It can be changed to other custom animations with `customAnimationOnSwipe` prop, but default iOS swipe animation is not achievable due to usage of custom recognizer. Defaults to `false`.

### `fullScreenSwipeShadowEnabled` (iOS only)

Boolean indicating whether the full screen dismiss gesture has shadow under view during transition. The gesture uses custom transition and thus
doesn't have a shadow by default. When enabled, a custom shadow view is added during the transition which tries to mimic the
default iOS shadow. Defaults to `false`.

#### `gestureEnabled` (iOS only)

Whether you can use gestures to dismiss this screen. Defaults to `true`.

#### `gestureResponseDistance` (iOS only)

Use it to restrict the distance from the edges of screen in which the gesture should be recognized. To be used alongside `fullScreenSwipeEnabled`. The responsive area is covered with 4 values: `start`, `end`, `top`, `bottom`. Example usage:

```tsx
gestureResponseDistance: {
  start: 200,
  end: 250,
  top: 100,
  bottom: 150,
}
```

#### `headerBackTitle`

Title string used by the back button on iOS. Defaults to the previous scene's `headerTitle` when not set or set to whitespace only value.

#### `headerBackTitleStyle`

Style object for header back title. Supported properties:

- `fontFamily`
- `fontSize`

#### `headerBackTitleVisible` (iOS only)

Whether the back button title should be visible or not. Defaults to `true`.

#### `headerCenter`

Function which returns a React Element to display in the center of the header.

#### `headerHideBackButton`

Boolean indicating whether to hide the back button in the header.

#### `headerHideShadow`

Boolean indicating whether to hide the elevation shadow on the header.

#### `headerLargeStyle` (iOS only)

Style object for the large header. Supported properties:

- `backgroundColor`

#### `headerLargeTitle` (iOS only)

Boolean used to set a native property to prefer a large title header (like in iOS setting).

For the large title to collapse on scroll, the content of the screen should be wrapped in a scrollable view such as `ScrollView` or `FlatList`. If the scrollable area doesn't fill the screen, the large title won't collapse on scroll.

#### `headerLargeTitleHideShadow` (iOS only)

Boolean that allows for disabling drop shadow under navigation header when the edge of any scrollable content reaches the matching edge of the navigation bar.

#### `headerLargeTitleStyle` (iOS only)

Style object for header large title. Supported properties:

- `fontFamily`
- `fontSize`
- `color`

#### `headerLeft`

Function which returns a React Element to display on the left side of the header. For now, on Android, using it will cause the title to also disappear.

#### `headerRight`

Function which returns a React Element to display on the right side of the header.

#### `headerShown`

Whether to show or hide the header for the screen. The header is shown by default. Setting this to `false` hides the header.

#### `headerStyle`

Style object for the header. Supported properties:

- `backgroundColor`
- `blurEffect` (iOS only).

#### `headerTintColor`

Tint color for the header. Changes the color of the back button and title.

#### `headerTitle`

String to be used by the header as title string. Defaults to scene `title`.

#### `headerTitleStyle`

Style object for header title. Supported properties:

- `fontFamily`
- `fontSize`
- `fontWeight`
- `color`

#### `headerTopInsetEnabled` (Android only)

A Boolean to that lets you opt out of insetting the header. You may want to \* set this to `false` if you use an opaque status bar. Defaults to `true`. Insets are always applied on iOS because the header cannot be opaque.

#### `headerTranslucent`

Boolean indicating whether the navigation bar is translucent.

#### `hideKeyboardOnSwipe` (iOS only)

Whether the keyboard should hide when swiping to the previous screen. Defaults to `false`.

#### `homeIndicatorHidden` (iOS only)

Whether the home indicator should be hidden on this screen. Defaults to `false`.

#### `nativeBackButtonDismissalEnabled` (Android only)

Boolean indicating whether, when the Android default back button is clicked, the `pop` action should be performed on the native side or on the JS side to be able to prevent it.
Unfortunately the same behavior is not available on iOS since the behavior of native back button cannot be changed there.

Defaults to `false`.

#### `navigationBarColor` (Android only)

Sets the navigation bar color. Defaults to initial status bar color.

#### `navigationBarHidden` (Android only)

Sets the visibility of the navigation bar. Defaults to `false`.

#### `replaceAnimation`

How should the screen replacing another screen animate.
The following values are currently supported:

- `push` – the new screen will perform push animation.
- `pop` – the new screen will perform pop animation.

Defaults to `pop`.

#### `sheetAllowedDetents` (iOS only)

Describes heights where a sheet can rest.
Works only when `stackPresentation` is set to `formSheet`.

Available values:

- `large` - only large detent level will be allowed
- `medium` - only medium detent level will be allowed
- `all` - all detent levels will be allowed

Defaults to `large`.

#### `sheetExpandsWhenScrolledToEdge` (iOS only)

Whether the sheet should expand to larger detent when scrolling.
Works only when `stackPresentation` is set to `formSheet`.

Defaults to `true`.

#### `sheetCornerRadius (iOS only)

The corner radius that the sheet will try to render with.
Works only when `stackPresentation` is set to `formSheet`.

If set to non-negative value it will try to render sheet with provided radius, else it will apply system default.

Defaults to system default.

#### `sheetGrabberVisible` (iOS only)

Boolean indicating whether the sheet shows a grabber at the top.
Works only when `stackPresentation` is set to `formSheet`.
Defaults to `false`.

#### `sheetLargestUndimmedDetent` (iOS only)

The largest sheet detent for which a view underneath won't be dimmed.
Works only when `stackPresentation` is set to `formSheet`.

If this prop is set to:

- `large` - the view underneath won't be dimmed at any detent level
- `medium` - the view underneath will be dimmed only when detent level is `large`
- `all` - the view underneath will be dimmed for any detent level

Defaults to `all`.

#### `stackAnimation`

How the given screen should appear/disappear when pushed or popped at the top of the stack. Possible values:

- `default` - uses a platform default animation
- `fade` - fades screen in or out.
- `fade_from_bottom` – performs a fade from bottom animation
- `flip` – flips the screen, requires stackPresentation: `modal` (iOS only)
- `simple_push` – performs a default animation, but without shadow and native header transition (iOS only)
- `slide_from_bottom` – performs a slide from bottom animation
- `slide_from_right` - slide in the new screen from right to left (Android only, resolves to default transition on iOS)
- `slide_from_left` - slide in the new screen from left to right
- `ios` - iOS like slide in animation (Android only, resolves to default transition on iOS)
- `none` - the screen appears/disappears without an animation.

Defaults to `default`.

#### `stackPresentation`

How the screen should be presented. Possible values:

- `push` - The new screen will be pushed onto a stack. The default animation on iOS is to slide from the side. The animation on Android may vary depending on the OS version and theme.
- `modal` - The new screen will be presented modally. In addition, this allows for a nested stack to be rendered inside such screens.
- `transparentModal` - The new screen will be presented modally. In addition, the second to last screen will remain attached to the stack container such that if the top screen is translucent, the content below can still be seen. If `"modal"` is used instead, the below screen gets removed as soon as the transition ends.
- `containedModal` – will use "UIModalPresentationCurrentContext" modal style on iOS and will fallback to `"modal"` on Android.
- `containedTransparentModal` – will use "UIModalPresentationOverCurrentContext" modal style on iOS and will fallback to `"transparentModal"` on Android.
- `fullScreenModal` – will use "UIModalPresentationFullScreen" modal style on iOS and will fallback to `"modal"` on Android.
- `formSheet` – will use "UIModalPresentationFormSheet" modal style on iOS and will fallback to `"modal"` on Android.

Defaults to `push`.

Using `containedModal` and `containedTransparentModal` with other types of modals in one native stack navigator is not recommended and can result in a freeze or a crash of the application.

#### `swipeDirection` (iOS only)

Sets the direction in which you should swipe to dismiss the screen. The following values are supported:

- `vertical` – dismiss screen vertically
- `horizontal` – dismiss screen horizontally (default)

When using `vertical` option, options `fullScreenSwipeEnabled: true`, `customAnimationOnSwipe: true` and `stackAnimation: 'slide_from_bottom'` are set by default.

#### `title`

A string that can be used as a fallback for `headerTitle`.

#### `transitionDuration` (iOS only)

Changes the duration (in milliseconds) of `slide_from_bottom`, `fade_from_bottom`, `fade` and `simple_push` transitions on iOS. Defaults to `350`.

The duration of `default` and `flip` transitions isn't customizable.

### freezeOnBlur

Whether inactive screens should be suspended from re-rendering.

Defaults to `false`. When `enableFreeze()` is run at the top of the application defaults to `true`.

#### `useTransitionProgress`

Hook providing context value of transition progress of the current screen to be used with `react-native` `Animated`. It consists of 2 values:

- `progress` - `Animated.Value` between `0.0` and `1.0` with the progress of the current transition.
- `closing` - `Animated.Value` of `1` or `0` indicating if the current screen is being navigated into or from.
- `goingForward` - `Animated.Value` of `1` or `0` indicating if the current transition is pushing or removing screens.

```jsx
import { Animated } from 'react-native';
import { useTransitionProgress } from 'react-native-screens';

function Home() {
  const { progress } = useTransitionProgress();

  const opacity = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1.0, 0.0, 1.0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={{ opacity, height: 50, width: '100%', backgroundColor: 'green' }}
    />
  );
}
```

#### `useReanimatedTransitionProgress`

A callback called every frame during the transition of screens to be used with `react-native-reanimated` version `2.x`. It consists of 2 shared values:

- `progress` - between `0.0` and `1.0` with the progress of the current transition.
- `closing` - `1` or `0` indicating if the current screen is being navigated into or from.
- `goingForward` - `1` or `0` indicating if the current transition is pushing or removing screens.

In order to use it, you need to have `react-native-reanimated` version `2.x` installed in your project and wrap your code with `ReanimatedScreenProvider`, like this:

```jsx
import { ReanimatedScreenProvider } from 'react-native-screens/reanimated';

export default function App() {
  return (
    <ReanimatedScreenProvider>
      <YourApp />
    </ReanimatedScreenProvider>
  );
}
```

Then you can use `useReanimatedTransitionProgress` to get the shared values:

```jsx
import { useReanimatedTransitionProgress } from 'react-native-screens/reanimated';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';

function Home() {
  const reaProgress = useReanimatedTransitionProgress();
  const sv = useDerivedValue(
    () =>
      (reaProgress.progress.value < 0.5
        ? reaProgress.progress.value * 50
        : (1 - reaProgress.progress.value) * 50) + 50,
  );
  const reaStyle = useAnimatedStyle(() => {
    return {
      width: sv.value,
      height: sv.value,
      backgroundColor: 'blue',
    };
  });

  return <Animated.View style={reaStyle} />;
}
```

### Status bar and orientation managment

With `native-stack`, the status bar and screen orientation can be managed by `UIViewController` on iOS. On Android, the status bar and screen orientation can be managed by `FragmentActivity`. On iOS, it requires:

1. For status bar managment: enabling (or deleting) `View controller-based status bar appearance` in your Info.plist file (it disables the option to use React Native's `StatusBar` component).
2. For both status bar and orientation managment: adding `#import <RNScreens/UIViewController+RNScreens.h>` in your project's `AppDelegate.m` (you can see this change applied in the `AppDelegate.m` of `Example` project).

On Android, no additional setup is required, although, you should keep in mind that once you set the orientation or status bar props, `react-native-screens` will manage them on every screen, so you shouldn't use other methods of manipulating them then.

#### `screenOrientation`

Sets the current screen's available orientations and forces rotation if current orientation is not included. On iOS, if you have supported orientations set in `info.plist`, they will take precedence over this prop. Possible values:

- `default` - on iOS, it resolves to [UIInterfaceOrientationMaskAllButUpsideDown](https://developer.apple.com/documentation/uikit/uiinterfaceorientationmask/uiinterfaceorientationmaskallbutupsidedown?language=objc). On Android, this lets the system decide the best orientation.
- `all`
- `portrait`
- `portrait_up`
- `portrait_down`
- `landscape`
- `landscape_left`
- `landscape_right`

Defaults to `default`.

#### `statusBarAnimation`

Sets the status bar animation (similar to the `StatusBar` component). Possible values: `fade`, `none`, `slide`. On Android, this prop considers the transition of changing status bar color (see https://reactnative.dev/docs/statusbar#animated). There will be no animation if `none` provided.

Defaults to `fade` on iOS and `none` on Android.

#### `statusBarColor` (Android only)

Sets the status bar color (similar to the `StatusBar` component). Defaults to initial status bar color.

#### `statusBarHidden`

Boolean saying if the status bar for this screen is hidden.

Defaults to `false`.

#### `statusBarStyle`

Sets the status bar color (similar to the `StatusBar` component). On iOS, the possible values are: `auto` (based on [user interface style](https://developer.apple.com/documentation/uikit/uiuserinterfacestyle?language=objc), `inverted` (colors opposite to `auto`), `light`, `dark`. On Android, the status bar will be dark if set to `dark` and `light` otherwise.

Defaults to `auto`.

#### `statusBarTranslucent` (Android only)

Sets the translucency of the status bar (similar to the `StatusBar` component). Defaults to `false`.

### Search bar

The search bar is just a `searchBar` property that can be specified in the navigator's `screenOptions` or an individual screen's `options`. Search bars are rarely static so normally it is controlled by passing an object to `searchBar` navigation option in the component's body.

Example:

```js
React.useLayoutEffect(() => {
  navigation.setOptions({
    searchBar: {
      // search bar options
    },
  });
}, [navigation]);
```

We advise using `useLayoutEffect` hook instead of `useEffect` when managing `searchBar` props to avoid unexpected layout issues.

Supported properties are described below.

#### `autoCapitalize`

Controls whether the text is automatically auto-capitalized as it is entered by the user.
Possible values:

- `none`
- `words`
- `sentences`
- `characters`

Defaults to `sentences` on iOS and `'none'` on Android.

#### `autoFocus` (Android only)

When set to `true` focuses search bar automatically when screen is appearing. Default value is `false`.

#### `barTintColor`

The search field background color.

By default bar tint color is translucent.

#### `tintColor` (iOS only)

The color for the cursor caret and cancel button text.

#### `cancelButtonText` (iOS only)

The text to be used instead of default `Cancel` button text.

#### `disableBackButtonOverride` (Android only)

Default behavior is to prevent screen from going back when search bar is open (`disableBackButtonOverride: false`). If you don't want this to happen set `disableBackButtonOverride` to `true`

#### `hideNavigationBar` (iOS only)

Boolean indicating whether to hide the navigation bar during searching.

Defaults to `true`.

#### `hideWhenScrolling` (iOS only)

Boolean indicating whether to hide the search bar when scrolling.

Defaults to `true`.

#### `inputType` (Android only)

This prop is used to change type of the input and keyboard. Default value is `'text'`.

All values:

- `'text'` - normal text input
- `'number'` - number input
- `'email'` - email input
- `'phone'` - phone input

#### `obscureBackground` (iOS only)

Boolean indicating whether to obscure the underlying content with semi-transparent overlay.

Defaults to `true`.

#### `onBlur`

A callback that gets called when search bar has lost focus.

#### `onCancelButtonPress`

A callback that gets called when the cancel button is pressed.

#### `onChangeText`

A callback that gets called when the text changes. It receives the current text value of the search bar.

Example:

```js
const [search, setSearch] = React.useState('');

React.useLayoutEffect(() => {
  navigation.setOptions({
    searchBar: {
      onChangeText: event => setSearch(event.nativeEvent.text),
    },
  });
}, [navigation]);
```

#### `onClose` (Android only)

A callback that gets called when search bar is closing

#### `onFocus`

A callback that gets called when search bar has received focus.

#### `onOpen` (Android only)

A callback that gets called when search bar is expanding

#### `onSearchButtonPress`

A callback that gets called when the search button is pressed. It receives the current text value of the search bar.

#### `placeholder`

Text displayed when search field is empty.

Defaults to an empty string.

#### `placement` (iOS only)

Position of the search bar

Supported values:

- `automatic` - the search bar is placed according to current layout
- `inline` - the search bar is placed on the trailing edge of navigation bar
- `stacked` - the search bar is placed below the other content in navigation bar

Defaults to `stacked`

#### `textColor`

The search field text color.

#### `hintTextColor`

The search hint text color. (Android only)

#### `headerIconColor`

The search and close icon color shown in the header. (Android only)

#### `shouldShowHintSearchIcon`

Show the search hint icon when search bar is focused. (Android only)

#### `ref`

A React ref to imperatively modify search bar. Supported actions:

- `focus` - focus on search bar
- `blur` - remove focus from search bar
- `clearText` - clear text in search bar
- `setText` - set search bar's content to given string
- `cancelSearch` - cancel search in search bar.
- `toggleCancelButton` (iOS only) - toggle cancel button display near search bar.

### Events

The navigator can [emit events](https://reactnavigation.org/docs/navigation-events) on certain actions. Supported events are:

#### `appear` - deprecated

Use `transitionEnd` event with `data.closing: false` instead.

Event which fires when the screen appears.

Example:

```js
React.useEffect(() => {
  const unsubscribe = navigation.addListener('appear', e => {
    // Do something
  });

  return unsubscribe;
}, [navigation]);
```

#### `dismiss`

Event which fires when the current screen is dismissed by hardware back (on Android) or dismiss gesture (swipe back or down).

Example:

```js
React.useEffect(() => {
  const unsubscribe = navigation.addListener('dismiss', e => {
    // Do something
  });

  return unsubscribe;
}, [navigation]);
```

#### `transitionStart`

Event which fires when a transition animation starts.

Event data:

- `closing` - Whether the screen will be dismissed or will appear.

Example:

```js
React.useEffect(() => {
  const unsubscribe = navigation.addListener('transitionStart', e => {
    if (e.data.closing) {
      // Will be dismissed
    } else {
      // Will appear
    }
  });

  return unsubscribe;
}, [navigation]);
```

#### `transitionEnd`

Event which fires when a transition animation ends.

Event data:

- `closing` - Whether the screen was dismissed or did appear.

Example:

```js
React.useEffect(() => {
  const unsubscribe = navigation.addListener('transitionEnd', e => {
    if (e.data.closing) {
      // Was dismissed
    } else {
      // Did appear
    }
  });

  return unsubscribe;
}, [navigation]);
```

### Helpers

The stack navigator adds the following methods to the navigation prop:

#### `push`

Pushes a new screen to the top of the stack and navigate to it. The method accepts the following arguments:

- `name` - _string_ - Name of the route to push onto the stack.
- `params` - _object_ - Screen params to merge into the destination route (found in the pushed screen through `route.params`).

```js
navigation.push('Profile', { name: 'Michaś' });
```

#### `pop`

Pops the current screen from the stack and navigates back to the previous screen. It takes one optional argument (`count`), which allows you to specify how many screens to pop back by.

```js
navigation.pop();
```

#### `popToTop`

Pops all of the screens in the stack except the first one and navigates to it.

```js
navigation.popToTop();
```

## Additional options

### Measuring header's height

To measure header's height, you can use the `useHeaderHeight`, `useAnimatedHeaderHeight` or `useReanimatedHeaderHeight` hook.

- `useHeaderHeight` returns the static header's height. The value provided by this hook changes when screen appears, when there's a change in header options or screen orientation.
  Use this hook if you're sure your header height won't change dynamically, or when the screen is heavy.
- `useAnimatedHeaderHeight` dynamically calculates the header's height. The value provided by this hook changes with every view layout (such as shrinking a large header into small one with a ScrollView). It returns an Animated.Value.
  Please beware of using this hook in heavy components, as it may result in performance issues.
- `useReanimatedHeaderHeight` also dynamically calculates the header's height but uses React Native Reanimated under the hood. It returns an Animated.SharedValue.
  Make sure to wrap your Stack.Navigator with `ReanimatedScreenProvider` before using this hook.

We recommend using `useReanimatedHeaderHeight` rather than `useAnimatedHeaderHeight`. See [Shared Values vs Animated.Value](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/shared-values/#shared-values-vs-animatedvalue) section in React Native Reanimated's documentation for full comparison.

```tsx
// for using useHeaderHeight
import { useHeaderHeight } from 'react-native-screens/native-stack';

// for using useAnimatedHeaderHeight
import { useAnimatedHeaderHeight } from 'react-native-screens/native-stack';

// for using useReanimatedHeaderHeight
import { useReanimatedHeaderHeight } from 'react-native-screens/reanimated';
```

## Example

```js
import { createNativeStackNavigator } from 'react-native-screens/native-stack';

const Stack = createNativeStackNavigator();

function MyStack() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        headerTintColor: 'white',
        headerStyle: { backgroundColor: 'tomato' },
      }}>
      <Stack.Screen
        name="Home"
        component={Home}
        options={{
          title: 'Awesome app',
        }}
      />
      <Stack.Screen
        name="Profile"
        component={Profile}
        options={{
          title: 'My profile',
        }}
      />
      <Stack.Screen
        name="Settings"
        component={Settings}
        options={{
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}
```
