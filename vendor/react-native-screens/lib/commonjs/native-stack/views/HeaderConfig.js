"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = HeaderConfig;
var _native = require("@react-navigation/native");
var React = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _reactNativeScreens = require("react-native-screens");
var _useBackPressSubscription = require("../utils/useBackPressSubscription");
var _FontProcessor = require("./FontProcessor");
var _warnOnce = _interopRequireDefault(require("warn-once"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function HeaderConfig({
  backButtonImage,
  backButtonInCustomView,
  direction,
  disableBackButtonMenu,
  backButtonDisplayMode = 'default',
  headerBackTitle,
  headerBackTitleStyle = {},
  headerBackTitleVisible = true,
  headerCenter,
  headerHideBackButton,
  headerHideShadow,
  headerLargeStyle = {},
  headerLargeTitle,
  headerLargeTitleHideShadow,
  headerLargeTitleStyle = {},
  headerLeft,
  headerRight,
  headerShown,
  headerStyle = {},
  headerTintColor,
  headerTitle,
  headerTitleStyle = {},
  headerTopInsetEnabled = true,
  headerTranslucent,
  route,
  searchBar,
  title
}) {
  const {
    colors
  } = (0, _native.useTheme)();
  const tintColor = headerTintColor ?? colors.primary;

  // We need to use back press subscription here to override back button behavior on JS side.
  // Because screens are usually used with react-navigation and this library overrides back button
  // we need to handle it first in case when search bar is open
  const {
    handleAttached,
    handleDetached,
    clearSubscription,
    createSubscription
  } = (0, _useBackPressSubscription.useBackPressSubscription)({
    onBackPress: _reactNativeScreens.executeNativeBackPress,
    isDisabled: !searchBar || !!searchBar.disableBackButtonOverride
  });
  const [backTitleFontFamily, largeTitleFontFamily, titleFontFamily] = (0, _FontProcessor.processFonts)([headerBackTitleStyle.fontFamily, headerLargeTitleStyle.fontFamily, headerTitleStyle.fontFamily]);

  // We want to clear clearSubscription only when components unmounts or search bar changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => clearSubscription, [searchBar]);
  const processedSearchBarOptions = React.useMemo(() => {
    if (_reactNative.Platform.OS === 'android' && searchBar && !searchBar.disableBackButtonOverride) {
      const onFocus = (...args) => {
        createSubscription();
        searchBar.onFocus?.(...args);
      };
      const onClose = (...args) => {
        clearSubscription();
        searchBar.onClose?.(...args);
      };
      return {
        ...searchBar,
        onFocus,
        onClose
      };
    }
    return searchBar;
  }, [searchBar, createSubscription, clearSubscription]);

  // @ts-ignore isVision is not yet in the type definitions (RN 0.74+)
  const isVisionOS = _reactNative.Platform?.isVision;
  (0, _warnOnce.default)(isVisionOS && (headerTitleStyle.color !== undefined || headerTintColor !== undefined), 'headerTitleStyle.color and headerTintColor are not supported on visionOS.');
  return /*#__PURE__*/React.createElement(_reactNativeScreens.ScreenStackHeaderConfig, {
    backButtonInCustomView: backButtonInCustomView,
    backgroundColor: headerStyle.backgroundColor ? headerStyle.backgroundColor : colors.card,
    backTitle: headerBackTitle,
    backTitleFontFamily: backTitleFontFamily,
    backTitleFontSize: headerBackTitleStyle.fontSize,
    backTitleVisible: headerBackTitleVisible,
    blurEffect: headerStyle.blurEffect,
    color: tintColor,
    direction: direction,
    disableBackButtonMenu: disableBackButtonMenu,
    backButtonDisplayMode: backButtonDisplayMode,
    hidden: headerShown === false,
    hideBackButton: headerHideBackButton,
    hideShadow: headerHideShadow,
    largeTitle: headerLargeTitle,
    largeTitleBackgroundColor: headerLargeStyle.backgroundColor,
    largeTitleColor: headerLargeTitleStyle.color,
    largeTitleFontFamily: largeTitleFontFamily,
    largeTitleFontSize: headerLargeTitleStyle.fontSize,
    largeTitleFontWeight: headerLargeTitleStyle.fontWeight,
    largeTitleHideShadow: headerLargeTitleHideShadow,
    title: headerTitle !== undefined ? headerTitle : title !== undefined ? title : route.name,
    titleColor: headerTitleStyle.color !== undefined ? headerTitleStyle.color : headerTintColor !== undefined ? headerTintColor : colors.text,
    titleFontFamily: titleFontFamily,
    titleFontSize: headerTitleStyle.fontSize,
    titleFontWeight: headerTitleStyle.fontWeight,
    topInsetEnabled: headerTopInsetEnabled,
    translucent: headerTranslucent === true,
    onAttached: handleAttached,
    onDetached: handleDetached
  }, headerRight !== undefined ? /*#__PURE__*/React.createElement(_reactNativeScreens.ScreenStackHeaderRightView, null, headerRight({
    tintColor
  })) : null, backButtonImage !== undefined ? /*#__PURE__*/React.createElement(_reactNativeScreens.ScreenStackHeaderBackButtonImage, {
    key: "backImage",
    source: backButtonImage
  }) : null, headerLeft !== undefined ? /*#__PURE__*/React.createElement(_reactNativeScreens.ScreenStackHeaderLeftView, null, headerLeft({
    tintColor
  })) : null, headerCenter !== undefined ? /*#__PURE__*/React.createElement(_reactNativeScreens.ScreenStackHeaderCenterView, null, headerCenter({
    tintColor
  })) : null, _reactNativeScreens.isSearchBarAvailableForCurrentPlatform && processedSearchBarOptions !== undefined ? /*#__PURE__*/React.createElement(_reactNativeScreens.ScreenStackHeaderSearchBarView, null, /*#__PURE__*/React.createElement(_reactNativeScreens.SearchBar, processedSearchBarOptions)) : null);
}
//# sourceMappingURL=HeaderConfig.js.map