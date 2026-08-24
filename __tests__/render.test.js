/* eslint-env jest */
import React from 'react';
import { render } from '@testing-library/react-native';

import { GooglePlacesAutocomplete } from '../GooglePlacesAutocomplete';

describe('GooglePlacesAutocomplete — render', () => {
  it('mounts without throwing', () => {
    expect(() =>
      render(
        <GooglePlacesAutocomplete
          placeholder='Search'
          query={{ key: 'test-key', language: 'en' }}
        />,
      ),
    ).not.toThrow();
  });
});
