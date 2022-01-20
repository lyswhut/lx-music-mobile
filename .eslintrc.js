module.exports = {
  extends: [
    'standard',
    'plugin:react-hooks/recommended',
  ],
  plugins: ['html', 'react'],
  parser: '@babel/eslint-parser',
  rules: {
    'no-new': 'off',
    camelcase: 'off',
    'no-return-assign': 'off',
    'space-before-function-paren': ['error', 'never'],
    'no-var': 'error',
    'no-fallthrough': 'off',
    'prefer-promise-reject-errors': 'off',
    eqeqeq: 'off',
    'no-multiple-empty-lines': [1, { max: 2 }],
    'comma-dangle': [2, 'always-multiline'],
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error',
    'prefer-const': 'off',
  },
  settings: {
    'html/html-extensions': ['.jsx'],
  },
  ignorePatterns: ['vendors', '*.min.js'],
}
