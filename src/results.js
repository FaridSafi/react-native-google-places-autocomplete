/**
 * Pure helpers for turning API responses into the rows the list renders.
 * Kept free of React so they can be unit-tested directly.
 */

/**
 * Keep only the results carrying at least one of the requested types.
 *
 * Previously written as `types?.indexOf(t) !== -1`, which evaluated to
 * `undefined !== -1` — i.e. `true` — for results with no `types` field, so
 * untyped results slipped through the filter.
 */
export const filterResultsByTypes = (unfilteredResults, types) => {
  if (!types || types.length === 0) {
    return unfilteredResults;
  }

  return unfilteredResults.filter(
    (result) =>
      Array.isArray(result.types) &&
      result.types.some((type) => types.indexOf(type) !== -1),
  );
};

/** Map new (v1) Places API suggestions onto the legacy prediction shape. */
export const filterResultsByPlacePredictions = (unfilteredResults) => {
  const results = [];

  for (let i = 0; i < unfilteredResults.length; i++) {
    const { placePrediction } = unfilteredResults[i];

    if (!placePrediction) {
      continue;
    }

    results.push({
      description: placePrediction.text?.text,
      place_id: placePrediction.placeId,
      reference: placePrediction.placeId,
      structured_formatting: {
        main_text: placePrediction.structuredFormat?.mainText?.text,
        secondary_text: placePrediction.structuredFormat?.secondaryText?.text,
      },
      types: placePrediction.types ?? [],
    });
  }

  return results;
};

/**
 * Compose the rendered rows: predefined places (and optionally a "current
 * location" entry) followed by the API results.
 *
 * Returns the `results` array untouched when there is nothing to prepend, so
 * FlatList identity checks stay meaningful.
 */
export const buildRowsFromResults = (results, text, options) => {
  const {
    predefinedPlaces = [],
    predefinedPlacesAlwaysVisible = false,
    currentLocation = false,
    currentLocationLabel = 'Current location',
  } = options;

  const shouldDisplayPredefinedPlaces =
    predefinedPlacesAlwaysVisible === true ||
    ((!text || text.length === 0) && results.length === 0);

  if (!shouldDisplayPredefinedPlaces) {
    return results;
  }

  const rows = predefinedPlaces
    .filter((place) => place?.description?.length)
    .map((place) => ({ ...place, isPredefinedPlace: true }));

  if (currentLocation === true) {
    rows.unshift({
      description: currentLocationLabel,
      isCurrentLocation: true,
      isPredefinedPlace: true,
    });
  }

  if (rows.length === 0) {
    return results;
  }

  return [...rows, ...results];
};

/** Stable identity for a row, used as the FlatList key and loader target. */
export const getRowKey = (row) => {
  if (row.isCurrentLocation === true) {
    return 'current-location';
  }
  if (row.place_id) {
    return `place:${row.place_id}`;
  }
  if (row.isPredefinedPlace && row.description) {
    return `predefined:${row.description}`;
  }
  return `row:${row.description ?? ''}`;
};
