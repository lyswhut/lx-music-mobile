"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  enableScreens: true,
  enableFreeze: true,
  screensEnabled: true,
  freezeEnabled: true,
  shouldUseActivityState: true,
  Screen: true,
  NativeScreen: true,
  InnerScreen: true,
  ScreenContext: true,
  ScreenContainer: true,
  NativeScreenContainer: true,
  NativeScreenNavigationContainer: true,
  ScreenStack: true,
  ScreenStackHeaderConfig: true,
  ScreenStackHeaderSubview: true,
  ScreenStackHeaderLeftView: true,
  ScreenStackHeaderCenterView: true,
  ScreenStackHeaderRightView: true,
  ScreenStackHeaderBackButtonImage: true,
  ScreenStackHeaderSearchBarView: true,
  SearchBar: true,
  NativeSearchBar: true,
  NativeSearchBarCommands: true,
  FullWindowOverlay: true,
  NativeScreensModule: true,
  GHContext: true,
  isSearchBarAvailableForCurrentPlatform: true,
  isNewBackTitleImplementation: true,
  executeNativeBackPress: true,
  useTransitionProgress: true
};
Object.defineProperty(exports, "FullWindowOverlay", {
  enumerable: true,
  get: function () {
    return _FullWindowOverlay.default;
  }
});
Object.defineProperty(exports, "GHContext", {
  enumerable: true,
  get: function () {
    return _GHContext.GHContext;
  }
});
Object.defineProperty(exports, "InnerScreen", {
  enumerable: true,
  get: function () {
    return _Screen.InnerScreen;
  }
});
Object.defineProperty(exports, "NativeScreen", {
  enumerable: true,
  get: function () {
    return _Screen.NativeScreen;
  }
});
Object.defineProperty(exports, "NativeScreenContainer", {
  enumerable: true,
  get: function () {
    return _ScreenContainer.NativeScreenContainer;
  }
});
Object.defineProperty(exports, "NativeScreenNavigationContainer", {
  enumerable: true,
  get: function () {
    return _ScreenContainer.NativeScreenNavigationContainer;
  }
});
Object.defineProperty(exports, "NativeScreensModule", {
  enumerable: true,
  get: function () {
    return _NativeScreensModule.default;
  }
});
Object.defineProperty(exports, "NativeSearchBar", {
  enumerable: true,
  get: function () {
    return _SearchBar.NativeSearchBar;
  }
});
Object.defineProperty(exports, "NativeSearchBarCommands", {
  enumerable: true,
  get: function () {
    return _SearchBar.NativeSearchBarCommands;
  }
});
Object.defineProperty(exports, "Screen", {
  enumerable: true,
  get: function () {
    return _Screen.default;
  }
});
Object.defineProperty(exports, "ScreenContainer", {
  enumerable: true,
  get: function () {
    return _ScreenContainer.default;
  }
});
Object.defineProperty(exports, "ScreenContext", {
  enumerable: true,
  get: function () {
    return _Screen.ScreenContext;
  }
});
Object.defineProperty(exports, "ScreenStack", {
  enumerable: true,
  get: function () {
    return _ScreenStack.default;
  }
});
Object.defineProperty(exports, "ScreenStackHeaderBackButtonImage", {
  enumerable: true,
  get: function () {
    return _ScreenStackHeaderConfig.ScreenStackHeaderBackButtonImage;
  }
});
Object.defineProperty(exports, "ScreenStackHeaderCenterView", {
  enumerable: true,
  get: function () {
    return _ScreenStackHeaderConfig.ScreenStackHeaderCenterView;
  }
});
Object.defineProperty(exports, "ScreenStackHeaderConfig", {
  enumerable: true,
  get: function () {
    return _ScreenStackHeaderConfig.ScreenStackHeaderConfig;
  }
});
Object.defineProperty(exports, "ScreenStackHeaderLeftView", {
  enumerable: true,
  get: function () {
    return _ScreenStackHeaderConfig.ScreenStackHeaderLeftView;
  }
});
Object.defineProperty(exports, "ScreenStackHeaderRightView", {
  enumerable: true,
  get: function () {
    return _ScreenStackHeaderConfig.ScreenStackHeaderRightView;
  }
});
Object.defineProperty(exports, "ScreenStackHeaderSearchBarView", {
  enumerable: true,
  get: function () {
    return _ScreenStackHeaderConfig.ScreenStackHeaderSearchBarView;
  }
});
Object.defineProperty(exports, "ScreenStackHeaderSubview", {
  enumerable: true,
  get: function () {
    return _ScreenStackHeaderConfig.ScreenStackHeaderSubview;
  }
});
Object.defineProperty(exports, "SearchBar", {
  enumerable: true,
  get: function () {
    return _SearchBar.default;
  }
});
Object.defineProperty(exports, "enableFreeze", {
  enumerable: true,
  get: function () {
    return _core.enableFreeze;
  }
});
Object.defineProperty(exports, "enableScreens", {
  enumerable: true,
  get: function () {
    return _core.enableScreens;
  }
});
Object.defineProperty(exports, "executeNativeBackPress", {
  enumerable: true,
  get: function () {
    return _utils.executeNativeBackPress;
  }
});
Object.defineProperty(exports, "freezeEnabled", {
  enumerable: true,
  get: function () {
    return _core.freezeEnabled;
  }
});
Object.defineProperty(exports, "isNewBackTitleImplementation", {
  enumerable: true,
  get: function () {
    return _utils.isNewBackTitleImplementation;
  }
});
Object.defineProperty(exports, "isSearchBarAvailableForCurrentPlatform", {
  enumerable: true,
  get: function () {
    return _utils.isSearchBarAvailableForCurrentPlatform;
  }
});
Object.defineProperty(exports, "screensEnabled", {
  enumerable: true,
  get: function () {
    return _core.screensEnabled;
  }
});
Object.defineProperty(exports, "shouldUseActivityState", {
  enumerable: true,
  get: function () {
    return _core.shouldUseActivityState;
  }
});
Object.defineProperty(exports, "useTransitionProgress", {
  enumerable: true,
  get: function () {
    return _useTransitionProgress.default;
  }
});
var _types = require("./types");
Object.keys(_types).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _types[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _types[key];
    }
  });
});
var _core = require("./core");
var _Screen = _interopRequireWildcard(require("./components/Screen"));
var _ScreenContainer = _interopRequireWildcard(require("./components/ScreenContainer"));
var _ScreenStack = _interopRequireDefault(require("./components/ScreenStack"));
var _ScreenStackHeaderConfig = require("./components/ScreenStackHeaderConfig");
var _SearchBar = _interopRequireWildcard(require("./components/SearchBar"));
var _FullWindowOverlay = _interopRequireDefault(require("./components/FullWindowOverlay"));
var _NativeScreensModule = _interopRequireDefault(require("./fabric/NativeScreensModule"));
var _GHContext = require("./native-stack/contexts/GHContext");
var _utils = require("./utils");
var _useTransitionProgress = _interopRequireDefault(require("./useTransitionProgress"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
//# sourceMappingURL=index.js.map