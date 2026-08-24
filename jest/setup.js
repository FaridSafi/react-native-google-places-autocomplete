/* eslint-env jest */

// Silence the RN Animated/act noise that is irrelevant to these tests.
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

afterEach(() => {
  jest.clearAllMocks();
});
