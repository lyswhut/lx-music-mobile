module.exports = {
  upgrade: true,
  reject: [
    '@types/react',
    '@types/react-native',
    'message2call',
    'react',
    'react-native',
    'react-native-pager-view',
    'react-native-navigation',
    'eslint-plugin-react-hooks',
    '@react-native/metro-config',
    '@react-native/babel-preset',
    '@react-native/typescript-config',
    '@react-native-community/slider',
    '@react-native-async-storage/async-storage'
  ],

  // target: 'newest',
  // filter: [
  //   'react-native-navigation',
  // ],

  // target: 'patch',
  // filter: [
  //   '@types/react',
  //   '@types/react-native',
  //   'react',
  //   'react-native',
  //   '@react-native/metro-config',
  //   '@react-native/babel-preset',
  //   '@react-native/typescript-config',
  //   '@react-native-community/slider',
  //   'eslint-plugin-react-hooks',
  //   '@react-native-async-storage/async-storage'
  // ],
}
