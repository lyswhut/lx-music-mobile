// @ts-ignore: No declaration available
// eslint-disable-next-line import/no-named-as-default, import/default, import/no-named-as-default-member, import/namespace
import ReactNativeStyleAttributes from 'react-native/Libraries/Components/View/ReactNativeStyleAttributes';
export function processFonts(fontFamilies) {
  // @ts-ignore: React Native types are incorrect here and don't consider fontFamily a style value
  const fontFamilyProcessor = ReactNativeStyleAttributes.fontFamily?.process;
  if (typeof fontFamilyProcessor === 'function') {
    return fontFamilies.map(fontFamilyProcessor);
  }
  return fontFamilies;
}
//# sourceMappingURL=FontProcessor.js.map