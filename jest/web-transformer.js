/**
 * Transforms the library source the way a modern bundler (Expo web, Vite,
 * webpack with modern targets, RN with less aggressive transpilation) does:
 * `const`/`let` are preserved, so temporal-dead-zone violations throw instead
 * of being silently downgraded to `var` by @react-native/babel-preset.
 */
const babelJest = require('babel-jest').default;

module.exports = babelJest.createTransformer({
  babelrc: false,
  configFile: false,
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
});
