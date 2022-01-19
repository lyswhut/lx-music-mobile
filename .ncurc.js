module.exports = {
  upgrade: true,
  // target: 'newest',
  reject: [
    'readable-stream',
    'stream-browserify',
    'url',
    'util',
    'babel-jest',
    'jest',
  ]
}
