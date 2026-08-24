import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FlatList,
  Image,
  Keyboard,
  Platform,
  TextInput,
  View,
} from 'react-native';

import Row from './src/Row';
import { debounce as createDebounce } from './src/debounce';
import { stringify } from './src/queryString';
import {
  buildRowsFromResults,
  filterResultsByPlacePredictions,
  filterResultsByTypes,
  getRowKey,
} from './src/results';
import { mergeStyles } from './src/styles';
import { uuidv4 } from './src/uuid';

// ============================================================================
// CONSTANTS
//
// Every default that is an object or an array lives out here. Declaring them
// inline in the destructuring pattern created a fresh identity on every render,
// which silently defeated every useMemo/useCallback downstream of them.
// ============================================================================

const GOOGLE_API_BASE = 'https://maps.googleapis.com/maps/api';

const EMPTY_ARRAY = Object.freeze([]);
const EMPTY_OBJECT = Object.freeze({});

const DEFAULT_QUERY = Object.freeze({
  key: 'missing api key',
  language: 'en',
  types: 'geocode',
});

const DEFAULT_SEARCH_QUERY = Object.freeze({
  rankby: 'distance',
  type: 'restaurant',
});

const noop = () => {};

const defaultOnTimeout = () =>
  console.warn('google places autocomplete: request timeout');

const getRequestUrl = (requestUrl) => {
  if (requestUrl) {
    if (requestUrl.useOnPlatform === 'all') {
      return requestUrl.url;
    }
    if (requestUrl.useOnPlatform === 'web') {
      return Platform.select({ web: requestUrl.url, default: GOOGLE_API_BASE });
    }
  }
  return GOOGLE_API_BASE;
};

const setRequestHeaders = (request, headers) => {
  if (!headers) {
    return;
  }
  Object.keys(headers).forEach((key) =>
    request.setRequestHeader(key, headers[key]),
  );
};

/**
 * Resolve the geolocation provider *without* detaching the method from its
 * receiver — class-based implementations rely on `this`.
 */
const getGeolocationProvider = () => {
  const geolocation =
    typeof navigator !== 'undefined' ? navigator.geolocation : undefined;

  if (geolocation?.getCurrentPosition) {
    return geolocation;
  }
  if (geolocation?.default?.getCurrentPosition) {
    return geolocation.default;
  }
  return null;
};

/** Only the results that came from the API earn the "powered by Google" logo. */
const hasApiResults = (rows) => {
  for (let i = 0; i < rows.length; i++) {
    if (
      !('isCurrentLocation' in rows[i]) &&
      !('isPredefinedPlace' in rows[i])
    ) {
      return true;
    }
  }
  return false;
};

const isFocusInsideResultList = ({ relatedTarget }) => {
  if (!relatedTarget) {
    return false;
  }

  let node = relatedTarget.parentNode;
  while (node) {
    if (node.id === 'result-list-id') {
      return true;
    }
    node = node.parentNode;
  }
  return false;
};

// ============================================================================
// COMPONENT
// ============================================================================

export const GooglePlacesAutocomplete = forwardRef((props, ref) => {
  const {
    autoFillOnNotFound = false,
    children,
    currentLocation = false,
    currentLocationLabel = 'Current location',
    debounce: debounceMs = 0,
    disableScroll = false,
    enableHighAccuracyLocation = true,
    enablePoweredByContainer = true,
    fetchDetails = false,
    fields = '*',
    filterReverseGeocodingByTypes = EMPTY_ARRAY,
    GooglePlacesDetailsQuery = EMPTY_OBJECT,
    GooglePlacesSearchQuery = DEFAULT_SEARCH_QUERY,
    GoogleReverseGeocodingQuery = EMPTY_OBJECT,
    inbetweenCompo,
    isNewPlacesAPI = false,
    isRowScrollable = true,
    keepResultsAfterBlur = false,
    keyboardShouldPersistTaps = 'always',
    listEmptyComponent,
    listHoverColor = '#ececec',
    listLoaderComponent,
    listUnderlayColor = '#c8c7cc',
    listViewDisplayed: listViewDisplayedProp = 'auto',
    minLength = 0,
    nearbyPlacesAPI = 'GooglePlacesSearch',
    numberOfLines = 1,
    onFail,
    onNotFound,
    onPress: onPressProp = noop,
    onTimeout = defaultOnTimeout,
    placeholder = '',
    predefinedPlaces = EMPTY_ARRAY,
    predefinedPlacesAlwaysVisible = false,
    preProcess,
    query = DEFAULT_QUERY,
    renderDescription,
    renderHeaderComponent,
    renderLeftButton,
    renderRightButton,
    renderRow,
    requestUrl,
    styles = EMPTY_OBJECT,
    suppressDefaultStyles = false,
    textInputHide = false,
    textInputProps = EMPTY_OBJECT,
    timeout = 20000,
    ...restProps
  } = props;

  // --------------------------------------------------------------------------
  // Derived values
  // --------------------------------------------------------------------------

  const url = useMemo(() => getRequestUrl(requestUrl), [requestUrl]);
  const requestHeaders = requestUrl?.headers;
  const withCredentials = url === GOOGLE_API_BASE;

  const isSupportedPlatform = !(Platform.OS === 'web' && !requestUrl);

  const mergedStyles = useMemo(
    () => mergeStyles(styles, suppressDefaultStyles),
    [styles, suppressDefaultStyles],
  );

  const isAutoMode =
    listViewDisplayedProp === 'auto' || listViewDisplayedProp === undefined;

  const hasGeolocation = currentLocation === true && !!getGeolocationProvider();

  const rowOptions = useMemo(
    () => ({
      predefinedPlaces,
      predefinedPlacesAlwaysVisible,
      currentLocation: hasGeolocation,
      currentLocationLabel,
    }),
    [
      predefinedPlaces,
      predefinedPlacesAlwaysVisible,
      hasGeolocation,
      currentLocationLabel,
    ],
  );

  // --------------------------------------------------------------------------
  // State & refs
  // --------------------------------------------------------------------------

  const [stateText, setStateText] = useState('');
  const [dataSource, setDataSource] = useState(EMPTY_ARRAY);
  const [listWasDismissed, setListWasDismissed] = useState(false);
  const [listLoaderDisplayed, setListLoaderDisplayed] = useState(false);
  const [loadingRowKey, setLoadingRowKey] = useState(null);
  const [sessionToken, setSessionToken] = useState(uuidv4);

  const inputRef = useRef(null);
  const resultsRef = useRef(EMPTY_ARRAY);
  const requestsRef = useRef([]);
  const stateTextRef = useRef(stateText);
  const loadingRowKeyRef = useRef(loadingRowKey);
  const prevQueryStringRef = useRef(null);

  stateTextRef.current = stateText;
  loadingRowKeyRef.current = loadingRowKey;

  const queryString = useMemo(() => JSON.stringify(query), [query]);

  // --------------------------------------------------------------------------
  // Helpers
  //
  // Declaration order below is load-bearing: every one of these is read by the
  // ones that follow it. Reading a `const` above its declaration is a temporal
  // dead zone error under any bundler that does not downlevel `const` to `var`
  // (Expo web, Vite, webpack with modern targets).
  // --------------------------------------------------------------------------

  const abortRequests = useCallback(() => {
    requestsRef.current.forEach((request) => {
      request.onreadystatechange = null;
      request.abort();
    });
    requestsRef.current = [];
  }, []);

  const trackRequest = useCallback(
    (request) => {
      request.timeout = timeout;
      request.ontimeout = onTimeout;
      requestsRef.current.push(request);
      return request;
    },
    [timeout, onTimeout],
  );

  const buildRows = useCallback(
    (results, text) => buildRowsFromResults(results, text, rowOptions),
    [rowOptions],
  );

  const disableRowLoaders = useCallback(() => setLoadingRowKey(null), []);

  const reportFailure = useCallback(
    (message) => {
      if (onFail) {
        onFail(message);
      } else {
        console.warn('google places autocomplete: ' + message);
      }
    },
    [onFail],
  );

  const renderRowDescription = useCallback(
    (rowData) => {
      if (renderDescription) {
        return renderDescription(rowData);
      }
      return rowData.description || rowData.formatted_address || rowData.name;
    },
    [renderDescription],
  );

  const getPredefinedPlace = useCallback(
    (rowData) => {
      if (rowData.isPredefinedPlace !== true) {
        return rowData;
      }
      const match = predefinedPlaces.find(
        (place) => place?.description === rowData.description,
      );
      return match || rowData;
    },
    [predefinedPlaces],
  );

  const showResults = useCallback(
    (results, text) => {
      resultsRef.current = results;
      setDataSource(buildRows(results, text));
      setListWasDismissed(false);
    },
    [buildRows],
  );

  // --------------------------------------------------------------------------
  // Requests
  // --------------------------------------------------------------------------

  const requestNearby = useCallback(
    (latitude, longitude) => {
      abortRequests();

      if (latitude == null || longitude == null) {
        resultsRef.current = EMPTY_ARRAY;
        setDataSource(buildRows(EMPTY_ARRAY, ''));
        return;
      }

      const request = trackRequest(new XMLHttpRequest());

      request.onreadystatechange = () => {
        if (request.readyState !== 4) {
          setListLoaderDisplayed(true);
          return;
        }

        setListLoaderDisplayed(false);

        if (request.status !== 200) {
          return;
        }

        const responseJSON = JSON.parse(request.responseText);
        disableRowLoaders();

        if (typeof responseJSON.results !== 'undefined') {
          const results =
            nearbyPlacesAPI === 'GoogleReverseGeocoding'
              ? filterResultsByTypes(
                  responseJSON.results,
                  filterReverseGeocodingByTypes,
                )
              : responseJSON.results;

          showResults(results, '');
        }

        if (typeof responseJSON.error_message !== 'undefined') {
          reportFailure(responseJSON.error_message);
        }
      };

      const requestUrlPath =
        nearbyPlacesAPI === 'GoogleReverseGeocoding'
          ? `${url}/geocode/json?` +
            stringify({
              latlng: `${latitude},${longitude}`,
              key: query.key,
              ...GoogleReverseGeocodingQuery,
            })
          : `${url}/place/nearbysearch/json?` +
            stringify({
              location: `${latitude},${longitude}`,
              key: query.key,
              ...GooglePlacesSearchQuery,
            });

      request.open('GET', requestUrlPath);
      request.withCredentials = withCredentials;
      setRequestHeaders(request, requestHeaders);
      request.send();
    },
    [
      abortRequests,
      trackRequest,
      buildRows,
      disableRowLoaders,
      showResults,
      reportFailure,
      nearbyPlacesAPI,
      filterReverseGeocodingByTypes,
      url,
      query.key,
      GoogleReverseGeocodingQuery,
      GooglePlacesSearchQuery,
      withCredentials,
      requestHeaders,
    ],
  );

  const request = useCallback(
    (text) => {
      abortRequests();

      if (!isSupportedPlatform) {
        return;
      }

      if (!text || text.length < minLength) {
        resultsRef.current = EMPTY_ARRAY;
        setDataSource(buildRows(EMPTY_ARRAY, ''));
        return;
      }

      const httpRequest = trackRequest(new XMLHttpRequest());

      httpRequest.onreadystatechange = () => {
        if (httpRequest.readyState !== 4) {
          setListLoaderDisplayed(true);
          return;
        }

        setListLoaderDisplayed(false);

        if (httpRequest.status !== 200) {
          reportFailure('request could not be completed or has been aborted');
          return;
        }

        const responseJSON = JSON.parse(httpRequest.responseText);

        if (typeof responseJSON.predictions !== 'undefined') {
          const results =
            nearbyPlacesAPI === 'GoogleReverseGeocoding'
              ? filterResultsByTypes(
                  responseJSON.predictions,
                  filterReverseGeocodingByTypes,
                )
              : responseJSON.predictions;

          showResults(results, text);
        }

        if (typeof responseJSON.suggestions !== 'undefined') {
          showResults(
            filterResultsByPlacePredictions(responseJSON.suggestions),
            text,
          );
        }

        if (typeof responseJSON.error_message !== 'undefined') {
          reportFailure(responseJSON.error_message);
        }
      };

      if (preProcess) {
        setStateText(preProcess(text));
      }

      if (isNewPlacesAPI) {
        const keyQueryParam = query.key
          ? '?' + stringify({ key: query.key })
          : '';
        httpRequest.open(
          'POST',
          `${url}/v1/places:autocomplete${keyQueryParam}`,
        );
      } else {
        httpRequest.open(
          'GET',
          `${url}/place/autocomplete/json?input=` +
            encodeURIComponent(text) +
            '&' +
            stringify(query),
        );
      }

      httpRequest.withCredentials = withCredentials;
      setRequestHeaders(httpRequest, requestHeaders);

      if (isNewPlacesAPI) {
        // v1 renamed/removed several legacy parameters. `language` in
        // particular is rejected outright — it is `languageCode` now.
        const { key, locationbias, types, language, ...rest } = query;
        const body = { input: text, sessionToken, ...rest };

        if (language) {
          body.languageCode = language;
        }

        httpRequest.send(JSON.stringify(body));
      } else {
        httpRequest.send();
      }
    },
    [
      abortRequests,
      trackRequest,
      buildRows,
      showResults,
      reportFailure,
      isSupportedPlatform,
      minLength,
      nearbyPlacesAPI,
      filterReverseGeocodingByTypes,
      preProcess,
      isNewPlacesAPI,
      url,
      query,
      sessionToken,
      withCredentials,
      requestHeaders,
    ],
  );

  // The debounced caller reads through a ref so it always invokes the current
  // closure without having to be rebuilt (and reset) on every render.
  const requestRef = useRef(null);
  useEffect(() => {
    requestRef.current = request;
  }, [request]);

  const debouncedRequest = useMemo(
    () => createDebounce((text) => requestRef.current?.(text), debounceMs),
    [debounceMs],
  );

  const getCurrentLocation = useCallback(() => {
    const provider = getGeolocationProvider();

    if (!provider) {
      return;
    }

    const options =
      enableHighAccuracyLocation && Platform.OS === 'android'
        ? { enableHighAccuracy: true, timeout: 20000 }
        : { enableHighAccuracy: false, timeout: 20000, maximumAge: 1000 };

    provider.getCurrentPosition(
      (position) => {
        if (nearbyPlacesAPI === 'None') {
          const currentLocationData = {
            description: currentLocationLabel,
            geometry: {
              location: {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              },
            },
          };

          disableRowLoaders();
          onPressProp(currentLocationData, currentLocationData);
          return;
        }

        requestNearby(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        disableRowLoaders();
        console.error(error.message);
      },
      options,
    );
  }, [
    enableHighAccuracyLocation,
    currentLocationLabel,
    nearbyPlacesAPI,
    disableRowLoaders,
    onPressProp,
    requestNearby,
  ]);

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  const hideListView = useCallback(
    (force = false) => {
      if (!keepResultsAfterBlur || force) {
        setListWasDismissed(true);
      }
    },
    [keepResultsAfterBlur],
  );

  const handleBlur = useCallback(
    (event) => {
      if (event && isFocusInsideResultList(event)) {
        return;
      }
      hideListView();
      inputRef.current?.blur();
    },
    [hideListView],
  );

  const fetchPlaceDetails = useCallback(
    (rowData) => {
      hideListView(true);
      Keyboard.dismiss();
      abortRequests();
      setLoadingRowKey(getRowKey(rowData));

      const detailsRequest = trackRequest(new XMLHttpRequest());

      detailsRequest.onreadystatechange = () => {
        if (detailsRequest.readyState !== 4) {
          return;
        }

        if (detailsRequest.status !== 200) {
          disableRowLoaders();
          reportFailure('request could not be completed or has been aborted');
          return;
        }

        const responseJSON = JSON.parse(detailsRequest.responseText);
        const succeeded =
          responseJSON.status === 'OK' || (isNewPlacesAPI && responseJSON.id);

        disableRowLoaders();

        if (succeeded) {
          const details = isNewPlacesAPI ? responseJSON : responseJSON.result;
          handleBlur();
          setStateText(renderRowDescription(rowData));
          onPressProp(rowData, details);
          return;
        }

        if (autoFillOnNotFound) {
          setStateText(renderRowDescription(rowData));
        }

        if (onNotFound) {
          onNotFound(responseJSON);
        } else {
          console.warn('google places autocomplete: ' + responseJSON.status);
        }
      };

      if (isNewPlacesAPI) {
        detailsRequest.open(
          'GET',
          `${url}/v1/places/${rowData.place_id}?` +
            stringify({ key: query.key, sessionToken, fields }),
        );
        setSessionToken(uuidv4());
      } else {
        detailsRequest.open(
          'GET',
          `${url}/place/details/json?` +
            stringify({
              key: query.key,
              placeid: rowData.place_id,
              language: query.language,
              ...GooglePlacesDetailsQuery,
            }),
        );
      }

      detailsRequest.withCredentials = withCredentials;
      setRequestHeaders(detailsRequest, requestHeaders);
      detailsRequest.send();
    },
    [
      hideListView,
      abortRequests,
      trackRequest,
      disableRowLoaders,
      reportFailure,
      handleBlur,
      renderRowDescription,
      onPressProp,
      onNotFound,
      autoFillOnNotFound,
      isNewPlacesAPI,
      url,
      query.key,
      query.language,
      sessionToken,
      fields,
      GooglePlacesDetailsQuery,
      withCredentials,
      requestHeaders,
    ],
  );

  const handleRowPress = useCallback(
    (rowData) => {
      if (rowData.isCurrentLocation === true) {
        hideListView(true);
        setLoadingRowKey(getRowKey(rowData));
        setStateText(renderRowDescription(rowData));
        getCurrentLocation();
        return;
      }

      if (rowData.isPredefinedPlace !== true && fetchDetails === true) {
        if (loadingRowKeyRef.current === getRowKey(rowData)) {
          return; // already requesting
        }
        fetchPlaceDetails(rowData);
        return;
      }

      hideListView(true);
      setStateText(renderRowDescription(rowData));
      handleBlur();

      // Predefined places are handed back as their own details payload.
      const predefinedPlace = getPredefinedPlace(rowData);
      onPressProp(predefinedPlace, predefinedPlace);
    },
    [
      hideListView,
      renderRowDescription,
      getCurrentLocation,
      fetchDetails,
      fetchPlaceDetails,
      handleBlur,
      getPredefinedPlace,
      onPressProp,
    ],
  );

  const handleChangeText = useCallback(
    (text) => {
      setListWasDismissed(false);
      setStateText(text);
      debouncedRequest(text);
      textInputProps?.onChangeText?.(text);
    },
    [debouncedRequest, textInputProps],
  );

  const handleFocus = useCallback(
    (event) => {
      setListWasDismissed(false);
      textInputProps?.onFocus?.(event);
    },
    [textInputProps],
  );

  const handleInputBlur = useCallback(
    (event) => {
      handleBlur(event);
      textInputProps?.onBlur?.(event);
    },
    [handleBlur, textInputProps],
  );

  // --------------------------------------------------------------------------
  // Effects
  // --------------------------------------------------------------------------

  useEffect(() => {
    if (Platform.OS === 'web' && !requestUrl) {
      console.warn(
        'This library cannot be used for the web unless you specify the requestUrl prop. See https://git.io/JflFv for more for details.',
      );
    }
  }, [requestUrl]);

  useEffect(() => {
    if (currentLocation === true && !hasGeolocation) {
      console.warn(
        Platform.OS === 'web'
          ? 'Geolocation is not available. For web, ensure your site is served over HTTPS or localhost to use geolocation features.'
          : 'Geolocation is not available. For React Native, you may need to install and configure @react-native-community/geolocation or expo-location to enable currentLocation.',
      );
    }
  }, [currentLocation, hasGeolocation]);

  // Rebuild the rows whenever the predefined-place configuration changes.
  useEffect(() => {
    setDataSource(buildRows(resultsRef.current, stateTextRef.current));
  }, [buildRows]);

  // Re-run the current search when the query object changes.
  useEffect(() => {
    if (prevQueryStringRef.current === null) {
      prevQueryStringRef.current = queryString;
      return;
    }
    if (prevQueryStringRef.current === queryString) {
      return;
    }

    prevQueryStringRef.current = queryString;
    const text = stateTextRef.current;

    if (text && text.length >= minLength) {
      debouncedRequest(text);
    }
  }, [queryString, minLength, debouncedRequest]);

  // Aborting belongs to the component lifetime, not to every keystroke. It used
  // to be tangled into the query effect, whose `stateText` dependency meant a
  // `preProcess` call would abort the very request it had just sent.
  useEffect(
    () => () => {
      debouncedRequest.cancel();
      abortRequests();
    },
    [debouncedRequest, abortRequests],
  );

  // --------------------------------------------------------------------------
  // Imperative handle
  // --------------------------------------------------------------------------

  useImperativeHandle(
    ref,
    () => ({
      setAddressText: (address) => setStateText(address),
      getAddressText: () => stateTextRef.current,
      blur: () => inputRef.current?.blur(),
      focus: () => inputRef.current?.focus(),
      isFocused: () => inputRef.current?.isFocused(),
      clear: () => inputRef.current?.clear(),
      getCurrentLocation,
    }),
    [getCurrentLocation],
  );

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  const renderItem = useCallback(
    ({ item, index }) => (
      <Row
        rowData={item}
        index={index}
        isLoading={loadingRowKey === getRowKey(item)}
        isRowScrollable={isRowScrollable}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        listHoverColor={listHoverColor}
        listUnderlayColor={listUnderlayColor}
        mergedStyles={mergedStyles}
        numberOfLines={numberOfLines}
        onBlur={handleBlur}
        onPress={handleRowPress}
        renderDescription={renderRowDescription}
        renderRow={renderRow}
      />
    ),
    [
      loadingRowKey,
      isRowScrollable,
      keyboardShouldPersistTaps,
      listHoverColor,
      listUnderlayColor,
      mergedStyles,
      numberOfLines,
      handleBlur,
      handleRowPress,
      renderRowDescription,
      renderRow,
    ],
  );

  const keyExtractor = useCallback(
    (item, index) => `${getRowKey(item)}:${index}`,
    [],
  );

  const Separator = useMemo(
    () =>
      function ItemSeparator() {
        return <View style={mergedStyles.separator} />;
      },
    [mergedStyles],
  );

  const poweredComponent = useMemo(() => {
    if (!enablePoweredByContainer || !hasApiResults(dataSource)) {
      return null;
    }

    return (
      <View style={mergedStyles.poweredContainer}>
        <Image
          style={mergedStyles.powered}
          resizeMode='contain'
          source={require('./images/powered_by_google_on_white.png')}
        />
      </View>
    );
  }, [enablePoweredByContainer, dataSource, mergedStyles]);

  // The list used to be gated on `dataSource.length > 0`, which meant
  // ListEmptyComponent — and therefore both listEmptyComponent and
  // listLoaderComponent — could never render.
  const emptyStateComponent = listLoaderDisplayed
    ? listLoaderComponent
    : stateText.length > minLength
    ? listEmptyComponent
    : null;

  const isListVisible = isAutoMode
    ? !listWasDismissed
    : listViewDisplayedProp === true;

  const shouldShowList =
    isSupportedPlatform &&
    isListVisible &&
    (dataSource.length > 0 || Boolean(emptyStateComponent));

  const {
    onFocus: _ignoredOnFocus,
    onBlur: _ignoredOnBlur,
    onChangeText: _ignoredOnChangeText,
    clearButtonMode,
    InputComp,
    ...userTextInputProps
  } = textInputProps || EMPTY_OBJECT;

  const TextInputComp = InputComp || TextInput;

  return (
    <View style={mergedStyles.container} pointerEvents='box-none'>
      {!textInputHide && (
        <View style={mergedStyles.textInputContainer}>
          {renderLeftButton ? renderLeftButton() : null}
          <TextInputComp
            ref={inputRef}
            style={mergedStyles.textInput}
            value={stateText}
            placeholder={placeholder}
            onFocus={handleFocus}
            onBlur={handleInputBlur}
            clearButtonMode={clearButtonMode || 'while-editing'}
            onChangeText={handleChangeText}
            {...userTextInputProps}
          />
          {renderRightButton ? renderRightButton() : null}
        </View>
      )}

      {inbetweenCompo}

      {shouldShowList ? (
        <FlatList
          nativeID='result-list-id'
          scrollEnabled={!disableScroll}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          style={mergedStyles.listView}
          data={dataSource}
          extraData={loadingRowKey}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={Separator}
          renderItem={renderItem}
          ListEmptyComponent={emptyStateComponent}
          ListHeaderComponent={
            renderHeaderComponent ? renderHeaderComponent(stateText) : null
          }
          ListFooterComponent={poweredComponent}
          {...restProps}
        />
      ) : null}

      {children}
    </View>
  );
});

GooglePlacesAutocomplete.displayName = 'GooglePlacesAutocomplete';

export default { GooglePlacesAutocomplete };
