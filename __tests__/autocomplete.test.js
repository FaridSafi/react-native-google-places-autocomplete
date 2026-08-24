/* eslint-env jest */
import React from 'react';
import { Text, View } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { GooglePlacesAutocomplete } from '../GooglePlacesAutocomplete';
import { PREDICTIONS, mockXhr } from '../jest/mock-xhr';

const QUERY = { key: 'test-key', language: 'en', types: 'geocode' };

const setup = (props = {}) =>
  render(
    <GooglePlacesAutocomplete
      placeholder='Search'
      query={QUERY}
      debounce={200}
      {...props}
    />,
  );

const type = (text) => {
  fireEvent.changeText(screen.getByPlaceholderText('Search'), text);
  act(() => {
    jest.advanceTimersByTime(200);
  });
};

beforeEach(() => {
  jest.useFakeTimers();
  mockXhr.install();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('search flow', () => {
  it('debounces, requests, and renders predictions', () => {
    setup();

    fireEvent.changeText(screen.getByPlaceholderText('Search'), 'par');
    expect(mockXhr.live).toHaveLength(0);

    act(() => {
      jest.advanceTimersByTime(200);
    });

    const request = mockXhr.last;
    expect(request.method).toBe('GET');
    expect(request.url).toContain('/place/autocomplete/json?input=par');
    expect(request.url).toContain('key=test-key');

    act(() => request.respond(PREDICTIONS));

    expect(screen.getByText('Paris, France')).toBeOnTheScreen();
    expect(screen.getByText('Paris, TX, USA')).toBeOnTheScreen();
  });

  it('does not fire below minLength', () => {
    setup({ minLength: 4 });
    type('par');
    expect(mockXhr.live).toHaveLength(0);

    type('pari');
    expect(mockXhr.live).toHaveLength(1);
  });

  it('aborts the in-flight request when a new search starts', () => {
    setup();
    type('par');
    const first = mockXhr.last;

    type('pari');
    expect(first.aborted).toBe(true);
    expect(mockXhr.last).not.toBe(first);
    expect(mockXhr.last.aborted).toBe(false);
  });

  it('aborts outstanding requests on unmount', () => {
    const view = setup();
    type('par');
    const request = mockXhr.last;

    view.unmount();
    expect(request.aborted).toBe(true);
  });

  it('calls onPress with the row when fetchDetails is off', () => {
    const onPress = jest.fn();
    setup({ onPress });
    type('par');
    act(() => mockXhr.last.respond(PREDICTIONS));

    fireEvent.press(screen.getByText('Paris, France'));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPress.mock.calls[0][0]).toMatchObject({ place_id: 'paris-id' });
  });

  it('fetches details and reports them to onPress', () => {
    const onPress = jest.fn();
    setup({ onPress, fetchDetails: true });
    type('par');
    act(() => mockXhr.last.respond(PREDICTIONS));

    fireEvent.press(screen.getByText('Paris, France'));

    const details = mockXhr.last;
    expect(details.url).toContain('/place/details/json?');
    expect(details.url).toContain('placeid=paris-id');

    act(() =>
      details.respond({
        status: 'OK',
        result: { name: 'Paris', place_id: 'paris-id' },
      }),
    );

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPress.mock.calls[0][1]).toMatchObject({ name: 'Paris' });
  });

  // Regression: setStateText() from preProcess re-ran the abort effect and
  // killed the request that had just been sent.
  it('does not abort its own request when preProcess is supplied', () => {
    setup({ preProcess: (text) => text.toUpperCase() });
    type('par');

    expect(mockXhr.live).toHaveLength(1);
    expect(mockXhr.last.aborted).toBe(false);

    act(() => mockXhr.last.respond(PREDICTIONS));
    expect(screen.getByText('Paris, France')).toBeOnTheScreen();
  });

  it('reports API error messages through onFail', () => {
    const onFail = jest.fn();
    setup({ onFail });
    type('par');
    act(() => mockXhr.last.respond({ error_message: 'over quota' }));

    expect(onFail).toHaveBeenCalledWith('over quota');
  });

  it('reports transport failures through onFail', () => {
    const onFail = jest.fn();
    setup({ onFail });
    type('par');
    act(() => mockXhr.last.fail(500));

    expect(onFail).toHaveBeenCalledTimes(1);
  });
});

describe('reverse geocoding type filter', () => {
  // Regression: results without a `types` field passed the filter.
  it('drops untyped results', () => {
    setup({
      nearbyPlacesAPI: 'GoogleReverseGeocoding',
      filterReverseGeocodingByTypes: ['locality'],
    });
    type('par');

    act(() =>
      mockXhr.last.respond({
        predictions: [
          { description: 'Typed match', place_id: '1', types: ['locality'] },
          { description: 'Untyped', place_id: '2' },
          { description: 'Wrong type', place_id: '3', types: ['route'] },
        ],
      }),
    );

    expect(screen.getByText('Typed match')).toBeOnTheScreen();
    expect(screen.queryByText('Untyped')).toBeNull();
    expect(screen.queryByText('Wrong type')).toBeNull();
  });
});

describe('list visibility', () => {
  // Regression: the FlatList was gated on dataSource.length > 0, so
  // ListEmptyComponent could never render.
  it('renders listEmptyComponent when a search returns nothing', () => {
    setup({
      minLength: 2,
      listEmptyComponent: () => <Text>No results</Text>,
    });
    type('par');
    act(() => mockXhr.last.respond({ predictions: [] }));

    expect(screen.getByText('No results')).toBeOnTheScreen();
  });

  it('renders listLoaderComponent while the request is in flight', () => {
    setup({
      minLength: 2,
      listLoaderComponent: () => <Text>Loading…</Text>,
    });
    type('par');
    act(() => mockXhr.last.progress());

    expect(screen.getByText('Loading…')).toBeOnTheScreen();

    act(() => mockXhr.last.respond(PREDICTIONS));
    expect(screen.queryByText('Loading…')).toBeNull();
  });

  // Regression: _onFocus unconditionally set listViewDisplayed to true, so a
  // controlled `false` was ignored after the first focus.
  it('respects a controlled listViewDisplayed={false}', () => {
    setup({ listViewDisplayed: false });
    fireEvent(screen.getByPlaceholderText('Search'), 'focus');
    type('par');
    act(() => mockXhr.last.respond(PREDICTIONS));

    expect(screen.queryByText('Paris, France')).toBeNull();
  });

  it('shows the list for a controlled listViewDisplayed={true}', () => {
    setup({ listViewDisplayed: true });
    type('par');
    act(() => mockXhr.last.respond(PREDICTIONS));

    expect(screen.getByText('Paris, France')).toBeOnTheScreen();
  });

  it('hides the list on blur unless keepResultsAfterBlur is set', () => {
    const { rerender } = setup();
    type('par');
    act(() => mockXhr.last.respond(PREDICTIONS));
    expect(screen.getByText('Paris, France')).toBeOnTheScreen();

    fireEvent(screen.getByPlaceholderText('Search'), 'blur');
    expect(screen.queryByText('Paris, France')).toBeNull();

    rerender(
      <GooglePlacesAutocomplete
        placeholder='Search'
        query={QUERY}
        debounce={200}
        keepResultsAfterBlur
      />,
    );
    type('par');
    act(() => mockXhr.last.respond(PREDICTIONS));
    fireEvent(screen.getByPlaceholderText('Search'), 'blur');
    expect(screen.getByText('Paris, France')).toBeOnTheScreen();
  });
});

describe('predefined places', () => {
  const predefinedPlaces = [
    { description: 'Home', geometry: { location: { lat: 1, lng: 2 } } },
  ];

  it('renders predefined places and returns them from onPress untouched', () => {
    const onPress = jest.fn();
    setup({ predefinedPlaces, onPress, fetchDetails: true });

    fireEvent.press(screen.getByText('Home'));

    expect(onPress).toHaveBeenCalledWith(
      predefinedPlaces[0],
      predefinedPlaces[0],
    );
    // A predefined place must not trigger a details lookup.
    expect(mockXhr.live).toHaveLength(0);
  });

  it('does not mutate the predefinedPlaces prop', () => {
    const snapshot = JSON.parse(JSON.stringify(predefinedPlaces));
    setup({ predefinedPlaces, fetchDetails: true });
    fireEvent.press(screen.getByText('Home'));
    expect(predefinedPlaces).toEqual(snapshot);
  });
});

describe('prop forwarding', () => {
  // Regression: 11 internal props fell into ...restProps and were spread onto
  // FlatList, reaching the underlying ScrollView / native view.
  it('does not leak internal props onto the list', () => {
    setup({
      renderRow: undefined,
      preProcess: (t) => t,
      renderDescription: (row) => row.description,
      renderHeaderComponent: () => <Text>Header</Text>,
      listEmptyComponent: () => <Text>Empty</Text>,
      listLoaderComponent: () => <Text>Loading</Text>,
      inbetweenCompo: <View testID='inbetween' />,
      requestUrl: { url: 'https://example.com/api', useOnPlatform: 'all' },
      children: <View testID='child' />,
    });
    type('par');
    act(() => mockXhr.last.respond(PREDICTIONS));

    const list = screen.UNSAFE_getByType(require('react-native').FlatList);

    for (const leaked of [
      'preProcess',
      'renderDescription',
      'renderHeaderComponent',
      'renderRow',
      'listEmptyComponent',
      'listLoaderComponent',
      'inbetweenCompo',
      'requestUrl',
      'renderLeftButton',
      'renderRightButton',
      'children',
    ]) {
      expect(list.props).not.toHaveProperty(leaked);
    }
  });

  it('still forwards genuine FlatList props', () => {
    setup({ initialNumToRender: 3, testID: 'results-list' });
    type('par');
    act(() => mockXhr.last.respond(PREDICTIONS));

    const list = screen.UNSAFE_getByType(require('react-native').FlatList);
    expect(list.props.initialNumToRender).toBe(3);
  });

  it('renders children and inbetweenCompo inside the container', () => {
    setup({
      inbetweenCompo: <View testID='inbetween' />,
      children: <View testID='child' />,
    });

    expect(screen.getByTestId('inbetween')).toBeOnTheScreen();
    expect(screen.getByTestId('child')).toBeOnTheScreen();
  });
});

describe('requestUrl', () => {
  it('uses a custom base url on every platform when useOnPlatform is "all"', () => {
    setup({
      requestUrl: {
        url: 'https://proxy.example.com/maps',
        useOnPlatform: 'all',
        headers: { Authorization: 'Bearer abc' },
      },
    });
    type('par');

    expect(mockXhr.last.url).toContain('https://proxy.example.com/maps');
    expect(mockXhr.last.headers).toEqual({ Authorization: 'Bearer abc' });
    // withCredentials must stay off for a non-Google host.
    expect(mockXhr.last.withCredentials).toBe(false);
  });
});

describe('new Places API', () => {
  it('POSTs to v1 autocomplete with a session token', () => {
    setup({ isNewPlacesAPI: true });
    type('par');

    const request = mockXhr.last;
    expect(request.method).toBe('POST');
    expect(request.url).toContain('/v1/places:autocomplete');
    expect(request.url).toContain('key=test-key');

    const body = JSON.parse(request.body);
    expect(body.input).toBe('par');
    expect(typeof body.sessionToken).toBe('string');
    // `language` is a legacy param; v1 expects languageCode.
    expect(body).not.toHaveProperty('language');
    expect(body.languageCode).toBe('en');
    expect(body).not.toHaveProperty('key');
    expect(body).not.toHaveProperty('types');
  });

  it('maps v1 suggestions into rows', () => {
    setup({ isNewPlacesAPI: true });
    type('par');
    act(() =>
      mockXhr.last.respond({
        suggestions: [
          {
            placePrediction: {
              placeId: 'paris-id',
              text: { text: 'Paris, France' },
              structuredFormat: {
                mainText: { text: 'Paris' },
                secondaryText: { text: 'France' },
              },
              types: ['locality'],
            },
          },
        ],
      }),
    );

    expect(screen.getByText('Paris, France')).toBeOnTheScreen();
  });
});

describe('imperative ref', () => {
  it('exposes the documented methods', () => {
    const ref = React.createRef();
    render(
      <GooglePlacesAutocomplete ref={ref} placeholder='Search' query={QUERY} />,
    );

    act(() => ref.current.setAddressText('Berlin'));
    expect(ref.current.getAddressText()).toBe('Berlin');
    expect(screen.getByPlaceholderText('Search').props.value).toBe('Berlin');

    expect(typeof ref.current.focus).toBe('function');
    expect(typeof ref.current.blur).toBe('function');
    expect(typeof ref.current.clear).toBe('function');
    expect(typeof ref.current.isFocused).toBe('function');
    expect(typeof ref.current.getCurrentLocation).toBe('function');
  });
});

describe('current location', () => {
  it('calls geolocation with its receiver intact', () => {
    const getCurrentPosition = jest.fn(function () {
      // Regression: the method was detached from navigator.geolocation, so
      // `this` was undefined for class-based implementations.
      expect(this).toBe(global.navigator.geolocation);
    });
    global.navigator.geolocation = { getCurrentPosition };

    const ref = React.createRef();
    render(
      <GooglePlacesAutocomplete
        ref={ref}
        placeholder='Search'
        query={QUERY}
        currentLocation
        nearbyPlacesAPI='None'
      />,
    );

    act(() => ref.current.getCurrentLocation());
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);

    delete global.navigator.geolocation;
  });

  it('reports the coordinates through onPress when nearbyPlacesAPI is None', () => {
    global.navigator.geolocation = {
      getCurrentPosition: (success) =>
        success({ coords: { latitude: 48.85, longitude: 2.35 } }),
    };
    const onPress = jest.fn();

    render(
      <GooglePlacesAutocomplete
        placeholder='Search'
        query={QUERY}
        currentLocation
        currentLocationLabel='Current location'
        nearbyPlacesAPI='None'
        onPress={onPress}
      />,
    );

    fireEvent.press(screen.getByText('Current location'));

    expect(onPress.mock.calls[0][0]).toMatchObject({
      description: 'Current location',
      geometry: { location: { lat: 48.85, lng: 2.35 } },
    });

    delete global.navigator.geolocation;
  });
});
