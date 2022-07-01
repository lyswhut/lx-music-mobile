module.exports = {
  upgrade: true,
  // target: 'newest',
  reject: [
    'metro-react-native-babel-preset',
    'readable-stream',
    'stream-browserify',
    'url',
    'util',
    'babel-jest',
    'jest',

    'react-native',
    'react',
    'react-test-renderer',
  ]
}
