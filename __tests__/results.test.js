/* eslint-env jest */
import {
  buildRowsFromResults,
  filterResultsByPlacePredictions,
  filterResultsByTypes,
} from '../src/results';

describe('filterResultsByTypes', () => {
  it('returns the input untouched when no types are requested', () => {
    const input = [{ types: ['locality'] }, {}];
    expect(filterResultsByTypes(input, [])).toBe(input);
    expect(filterResultsByTypes(input, undefined)).toBe(input);
  });

  it('keeps results that match at least one requested type', () => {
    const input = [
      { id: 1, types: ['locality', 'political'] },
      { id: 2, types: ['route'] },
      { id: 3, types: ['administrative_area_level_3'] },
    ];

    expect(
      filterResultsByTypes(input, ['locality', 'administrative_area_level_3']),
    ).toEqual([input[0], input[2]]);
  });

  // Regression: `types?.indexOf(t) !== -1` evaluated to `undefined !== -1`,
  // i.e. `true`, so results with no `types` field were wrongly kept.
  it('drops results that have no types field', () => {
    const input = [
      { id: 1 },
      { id: 2, types: null },
      { id: 3, types: ['locality'] },
    ];
    expect(filterResultsByTypes(input, ['locality'])).toEqual([input[2]]);
  });

  it('drops results whose types array is empty', () => {
    expect(filterResultsByTypes([{ types: [] }], ['locality'])).toEqual([]);
  });
});

describe('filterResultsByPlacePredictions', () => {
  it('maps new Places API suggestions to the legacy row shape', () => {
    const suggestions = [
      {
        placePrediction: {
          placeId: 'abc',
          text: { text: 'Paris, France' },
          structuredFormat: {
            mainText: { text: 'Paris' },
            secondaryText: { text: 'France' },
          },
          types: ['locality'],
        },
      },
      { queryPrediction: { text: { text: 'ignored' } } },
    ];

    expect(filterResultsByPlacePredictions(suggestions)).toEqual([
      {
        description: 'Paris, France',
        place_id: 'abc',
        reference: 'abc',
        structured_formatting: {
          main_text: 'Paris',
          secondary_text: 'France',
        },
        types: ['locality'],
      },
    ]);
  });

  it('defaults types to an empty array', () => {
    const [row] = filterResultsByPlacePredictions([
      { placePrediction: { placeId: 'x', text: { text: 'X' } } },
    ]);
    expect(row.types).toEqual([]);
  });
});

describe('buildRowsFromResults', () => {
  const predefined = [
    { description: 'Home', geometry: { location: { lat: 1, lng: 2 } } },
    { description: 'Work', geometry: { location: { lat: 3, lng: 4 } } },
  ];

  it('shows predefined places when there is no text and no results', () => {
    const rows = buildRowsFromResults([], '', {
      predefinedPlaces: predefined,
      predefinedPlacesAlwaysVisible: false,
      currentLocation: false,
    });

    expect(rows.map((r) => r.description)).toEqual(['Home', 'Work']);
    expect(rows.every((r) => r.isPredefinedPlace)).toBe(true);
  });

  it('hides predefined places once there are results', () => {
    const results = [{ description: 'Paris', place_id: 'p' }];
    const rows = buildRowsFromResults(results, 'par', {
      predefinedPlaces: predefined,
      predefinedPlacesAlwaysVisible: false,
      currentLocation: false,
    });

    expect(rows).toEqual(results);
  });

  it('keeps predefined places visible when predefinedPlacesAlwaysVisible is set', () => {
    const results = [{ description: 'Paris', place_id: 'p' }];
    const rows = buildRowsFromResults(results, 'par', {
      predefinedPlaces: predefined,
      predefinedPlacesAlwaysVisible: true,
      currentLocation: false,
    });

    expect(rows.map((r) => r.description)).toEqual(['Home', 'Work', 'Paris']);
  });

  it('drops predefined places without a description', () => {
    const rows = buildRowsFromResults([], '', {
      predefinedPlaces: [{ description: '' }, { foo: 'bar' }, predefined[0]],
      predefinedPlacesAlwaysVisible: false,
      currentLocation: false,
    });

    expect(rows.map((r) => r.description)).toEqual(['Home']);
  });

  it('prepends the current location row when enabled', () => {
    const rows = buildRowsFromResults([], '', {
      predefinedPlaces: predefined,
      predefinedPlacesAlwaysVisible: false,
      currentLocation: true,
      currentLocationLabel: 'Current location',
    });

    expect(rows[0]).toMatchObject({
      description: 'Current location',
      isCurrentLocation: true,
      isPredefinedPlace: true,
    });
  });

  it('does not mutate the caller-supplied predefined places', () => {
    const snapshot = JSON.parse(JSON.stringify(predefined));
    buildRowsFromResults([], '', {
      predefinedPlaces: predefined,
      predefinedPlacesAlwaysVisible: true,
      currentLocation: false,
    });
    expect(predefined).toEqual(snapshot);
  });
});
