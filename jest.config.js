const nativeTransform = {
  '\\.[jt]sx?$': [
    'babel-jest',
    { configFile: require.resolve('./babel.config.js') },
  ],
};

const base = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest/setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/example/'],
};

module.exports = {
  projects: [
    {
      ...base,
      displayName: 'native',
      transform: nativeTransform,
    },
    {
      // Same suite, but the library source keeps its `const`/`let` bindings.
      ...base,
      displayName: 'web-semantics',
      transform: {
        'GooglePlacesAutocomplete\\.js$': '<rootDir>/jest/web-transformer.js',
        ...nativeTransform,
      },
    },
  ],
};
