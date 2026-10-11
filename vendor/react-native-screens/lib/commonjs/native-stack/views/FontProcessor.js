"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.processFonts = processFonts;
var _ReactNativeStyleAttributes = _interopRequireDefault(require("react-native/Libraries/Components/View/ReactNativeStyleAttributes"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// @ts-ignore: No declaration available
// eslint-disable-next-line import/no-named-as-default, import/default, import/no-named-as-default-member, import/namespace

function processFonts(fontFamilies) {
  // @ts-ignore: React Native types are incorrect here and don't consider fontFamily a style value
  const fontFamilyProcessor = _ReactNativeStyleAttributes.default.fontFamily?.process;
  if (typeof fontFamilyProcessor === 'function') {
    return fontFamilies.map(fontFamilyProcessor);
  }
  return fontFamilies;
}
//# sourceMappingURL=FontProcessor.js.map