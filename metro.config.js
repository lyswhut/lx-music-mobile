const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')
const { createHarmonyMetroConfig } = require('@react-native-oh/react-native-harmony/metro.config')

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    extraNodeModules: {
      // crypto: require.resolve('react-native-quick-crypto'),
      // stream: require.resolve('stream-browserify'),
      buffer: require.resolve('@craftzdog/react-native-buffer'),
    },
  },
}

module.exports = mergeConfig(
  getDefaultConfig(__dirname),
  // RNOH: 为 harmony 平台把 import 的 react-native 重定向到 @react-native-oh/react-native-harmony；
  // 对 android/ios 平台此 resolveRequest 直接透传，不影响原有打包。
  createHarmonyMetroConfig({
    reactNativeHarmonyPackageName: '@react-native-oh/react-native-harmony',
  }),
  config,
)
