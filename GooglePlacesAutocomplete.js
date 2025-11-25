/* eslint-disable react-native/no-inline-styles */
import debounce from 'lodash.debounce';
import Qs from 'qs';
import uuid from 'react-native-uuid';
import React, {
  forwardRef,
  useMemo,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

// ============================================================================
// CONSTANTS
// ============================================================================

const defaultStyles = {
  container: {
    flex: 1,
  },
  textInputContainer: {
    flexDirection: 'row',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    height: 44,
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    fontSize: 15,
    flex: 1,
    marginBottom: 5,
  },
  listView: {
    backgroundColor: '#FFFFFF',
  },
  row: {
    backgroundColor: '#FFFFFF',
    padding: 13,
    minHeight: 44,
    flexDirection: 'row',
  },
  loader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    height: 20,
  },
  description: {},
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#c8c7cc',
  },
  poweredContainer: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderBottomRightRadius: 5,
    borderBottomLeftRadius: 5,
    borderColor: '#c8c7cc',
    borderTopWidth: 0.5,
  },
  powered: {},
};

// ============================================================================
// COMPONENT
// ============================================================================

export const GooglePlacesAutocomplete = forwardRef((props, ref) => {
  // ==========================================================================
  // PROPS DESTRUCTURING
  // ==========================================================================
  const {
    autoFillOnNotFound = false,
    currentLocation = false,
    currentLocationLabel = 'Current location',
    debounce: debounceMs = 0,
    disableScroll = false,
    enableHighAccuracyLocation = true,
    enablePoweredByContainer = true,
    fetchDetails = false,
    filterReverseGeocodingByTypes = [],
    GooglePlacesDetailsQuery = {},
    GooglePlacesSearchQuery = {
      rankby: 'distance',
      type: 'restaurant',
    },
    GoogleReverseGeocodingQuery = {},
    isRowScrollable = true,
    keyboardShouldPersistTaps = 'always',
    listHoverColor = '#ececec',
    listUnderlayColor = '#c8c7cc',
    listViewDisplayed: listViewDisplayedProp = 'auto',
    keepResultsAfterBlur = false,
    minLength = 0,
    nearbyPlacesAPI = 'GooglePlacesSearch',
    numberOfLines = 1,
    onFail = () => {},
    onNotFound = () => {},
    onPress = () => {},
    onTimeout = () =>
      console.warn('google places autocomplete: request timeout'),
    placeholder = '',
    predefinedPlaces: predefinedPlacesProp = [],
    predefinedPlacesAlwaysVisible = false,
    query = {
      key: 'missing api key',
      language: 'en',
      types: 'geocode',
    },
    styles = {},
    suppressDefaultStyles = false,
    textInputHide = false,
    textInputProps = {},
    timeout = 20000,
    isNewPlacesAPI = false,
    fields = '*',
    ...restProps
  } = props;

  // ==========================================================================
  // STATE & REFS
  // ==========================================================================
  const predefinedPlaces = useMemo(() => predefinedPlacesProp || [], [
    predefinedPlacesProp,
  ]);

  // Store results array - useRef prevents re-renders when updating results, allows access to latest results in callbacks
  const resultsRef = useRef([]);

  // Store active XMLHttpRequest objects - needed to abort requests when component unmounts or new search starts
  const requestsRef = useRef([]);

  // Track if navigator warning has been shown - prevents duplicate console warnings
  const hasWarnedAboutNavigator = useRef(false);

  // Reference to TextInput component - enables imperative methods (focus, blur, clear) via ref
  const inputRef = useRef(null);

  // Store current query object - allows access to latest query in callbacks without stale closures
  const queryRef = useRef(query);

  // Store previous query string - used to detect query changes without causing re-renders
  const prevQueryStringRef = useRef(JSON.stringify(query));

  // Store latest _request function - ensures debounced function always calls current version with latest closures
  const requestRef = useRef(_request);
  const queryString = useMemo(() => JSON.stringify(query), [query]);

  const [stateText, setStateText] = useState('');
  const [dataSource, setDataSource] = useState([]);
  const [listViewDisplayed, setListViewDisplayed] = useState(
    listViewDisplayedProp === 'auto' ? false : listViewDisplayedProp,
  );
  const [url, setUrl] = useState('');
  const [listLoaderDisplayed, setListLoaderDisplayed] = useState(false);
  const [sessionToken, setSessionToken] = useState(uuid.v4());

  // ==========================================================================
  // UTILITY FUNCTIONS
  // ==========================================================================

  const hasNavigator = useCallback(() => {
    if (navigator?.geolocation) {
      return true;
    }
    if (!hasWarnedAboutNavigator.current) {
      if (Platform.OS === 'web') {
        console.warn(
          'Geolocation is not available. For web, ensure your site is served over HTTPS or localhost to use geolocation features.',
        );
      } else {
        console.warn(
          'Geolocation is not available. For React Native, you may need to install and configure @react-native-community/geolocation or expo-location to enable currentLocation.',
        );
      }
      hasWarnedAboutNavigator.current = true;
    }
    return false;
  }, []);

  const supportedPlatform = () => {
    if (Platform.OS === 'web' && !props.requestUrl) {
      console.warn(
        'This library cannot be used for the web unless you specify the requestUrl prop. See https://git.io/JflFv for more for details.',
      );
      return false;
    }
    return true;
  };

  const getRequestUrl = useCallback(
    (requestUrl) => {
      // If using new Places API, default to places.googleapis.com
      if (isNewPlacesAPI && !requestUrl) {
        return 'https://places.googleapis.com';
      }

      if (requestUrl) {
        if (requestUrl.useOnPlatform === 'all') {
          return requestUrl.url;
        }
        if (requestUrl.useOnPlatform === 'web') {
          return Platform.select({
            web: requestUrl.url,
            default: isNewPlacesAPI
              ? 'https://places.googleapis.com'
              : 'https://maps.googleapis.com/maps/api',
          });
        }
      }
      return isNewPlacesAPI
        ? 'https://places.googleapis.com'
        : 'https://maps.googleapis.com/maps/api';
    },
    [isNewPlacesAPI],
  );

  const getRequestHeaders = useCallback(
    (requestUrl, isPlaceDetails = false) => {
      const headers = requestUrl?.headers || {};

      // Add required headers for new Places API if not already provided
      if (isNewPlacesAPI) {
        // Add API key to headers if not already provided
        if (!headers['X-Goog-Api-Key'] && query.key) {
          headers['X-Goog-Api-Key'] = query.key;
        }

        if (isPlaceDetails) {
          // For place details, use fields prop as field mask if not provided
          if (!headers['X-Goog-FieldMask'] && fields) {
            headers['X-Goog-FieldMask'] = fields;
          }
        } else {
          // For autocomplete, request both place and query predictions with all needed fields
          if (!headers['X-Goog-FieldMask']) {
            headers['X-Goog-FieldMask'] =
              'suggestions.placePrediction.text.text,suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.types,suggestions.queryPrediction.text.text';
          }
        }

        // Ensure Content-Type is set for POST requests
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }
      }

      return headers;
    },
    [isNewPlacesAPI, query.key, fields],
  );

  const setRequestHeaders = (request, headers) => {
    Object.keys(headers).forEach((headerKey) =>
      request.setRequestHeader(headerKey, headers[headerKey]),
    );
  };

  const requestShouldUseWithCredentials = useCallback(() => {
    return url === 'https://maps.googleapis.com/maps/api';
  }, [url]);

  const _abortRequests = useCallback(() => {
    requestsRef.current.forEach((request) => {
      request.onreadystatechange = null;
      request.abort();
    });
    requestsRef.current = [];
  }, []);

  // Helper function to extract error message from API response
  const extractErrorMessage = (responseJSON) => {
    // New Places API error format
    if (responseJSON.error) {
      if (responseJSON.error.message) {
        return responseJSON.error.message;
      }
      if (responseJSON.error.status) {
        return `${responseJSON.error.status}: ${
          responseJSON.error.message || 'Unknown error'
        }`;
      }
    }
    // Legacy API error format
    if (responseJSON.error_message) {
      return responseJSON.error_message;
    }
    if (responseJSON.status) {
      return responseJSON.status;
    }
    // Fallback
    return 'Unknown error occurred';
  };

  // ==========================================================================
  // DATA PROCESSING FUNCTIONS
  // ==========================================================================

  const buildRowsFromResults = useCallback(
    (results, text) => {
      let res = [];
      // Show predefined places if:
      // 1. No text entered and no results, OR
      // 2. predefinedPlacesAlwaysVisible is true
      const shouldDisplayPredefinedPlaces =
        (!text || text.length === 0) && results.length === 0;
      if (
        shouldDisplayPredefinedPlaces ||
        predefinedPlacesAlwaysVisible === true
      ) {
        if (predefinedPlaces.length > 0) {
          res = [
            ...predefinedPlaces.filter((place) => place?.description?.length),
          ];
        }

        if (currentLocation === true && hasNavigator()) {
          res.unshift({
            description: currentLocationLabel,
            isCurrentLocation: true,
          });
        }
      }

      res = res.map((place) => ({
        ...place,
        isPredefinedPlace: true,
      }));

      return [...res, ...results];
    },
    [
      predefinedPlacesAlwaysVisible,
      predefinedPlaces,
      currentLocation,
      currentLocationLabel,
      hasNavigator,
    ],
  );

  const _filterResultsByTypes = useCallback((unfilteredResults, types) => {
    if (!types || types.length === 0) return unfilteredResults;

    const results = [];
    for (let i = 0; i < unfilteredResults.length; i++) {
      let found = false;

      for (let j = 0; j < types.length; j++) {
        if (unfilteredResults[i].types?.indexOf(types[j]) !== -1) {
          found = true;
          break;
        }
      }

      if (found === true) {
        results.push(unfilteredResults[i]);
      }
    }
    return results;
  }, []);

  const _filterResultsByPlacePredictions = (unfilteredResults) => {
    const results = [];
    for (let i = 0; i < unfilteredResults.length; i++) {
      // Process place predictions (have placeId)
      if (unfilteredResults[i].placePrediction) {
        const placePred = unfilteredResults[i].placePrediction;
        results.push({
          description: placePred.text?.text,
          place_id: placePred.placeId,
          reference: placePred.placeId,
          structured_formatting: {
            main_text: placePred.structuredFormat?.mainText?.text,
            secondary_text: placePred.structuredFormat?.secondaryText?.text,
          },
          types: placePred.types ?? [],
        });
      }
      // Process query predictions (search queries, no placeId)
      // These are shown but can't be used for place details
      else if (unfilteredResults[i].queryPrediction) {
        const queryPred = unfilteredResults[i].queryPrediction;
        results.push({
          description: queryPred.text?.text,
          place_id: null, // Query predictions don't have place IDs
          reference: null,
          structured_formatting: {
            main_text: queryPred.text?.text,
            secondary_text: '',
          },
          types: [],
          isQueryPrediction: true, // Flag to identify query predictions
        });
      }
    }
    return results;
  };

  const _getPredefinedPlace = (rowData) => {
    if (rowData.isPredefinedPlace !== true) {
      return rowData;
    }

    if (predefinedPlaces.length > 0) {
      for (let i = 0; i < predefinedPlaces.length; i++) {
        if (predefinedPlaces[i].description === rowData.description) {
          return predefinedPlaces[i];
        }
      }
    }

    return rowData;
  };

  // ==========================================================================
  // API REQUEST FUNCTIONS
  // ==========================================================================

  const _requestNearby = useCallback(
    (latitude, longitude) => {
      _abortRequests();

      if (
        latitude !== undefined &&
        longitude !== undefined &&
        latitude !== null &&
        longitude !== null
      ) {
        const request = new XMLHttpRequest();
        requestsRef.current.push(request);
        request.timeout = timeout;
        request.ontimeout = onTimeout;
        request.onreadystatechange = () => {
          if (request.readyState !== 4) {
            setListLoaderDisplayed(true);
            return;
          }

          setListLoaderDisplayed(false);
          if (request.status === 200) {
            const responseJSON = JSON.parse(request.responseText);

            _disableRowLoaders();

            if (typeof responseJSON.results !== 'undefined') {
              let results = [];
              if (nearbyPlacesAPI === 'GoogleReverseGeocoding') {
                results = _filterResultsByTypes(
                  responseJSON.results,
                  filterReverseGeocodingByTypes,
                );
              } else {
                results = responseJSON.results;
              }

              resultsRef.current = results;
              const newDataSource = buildRowsFromResults(results);
              setDataSource(newDataSource);
              // Auto-show list when results arrive if in 'auto' mode
              if (
                listViewDisplayedProp === 'auto' &&
                newDataSource.length > 0
              ) {
                setListViewDisplayed(true);
              }
            }
            if (typeof responseJSON.error_message !== 'undefined') {
              // Always log the warning, and also call onFail if provided
              console.warn(
                'google places autocomplete: ' + responseJSON.error_message,
              );
              if (onFail) {
                onFail(responseJSON.error_message);
              }
            }
          }
        };

        let requestUrl = '';
        if (nearbyPlacesAPI === 'GoogleReverseGeocoding') {
          // your key must be allowed to use Google Maps Geocoding API
          requestUrl =
            `${url}/geocode/json?` +
            Qs.stringify({
              latlng: latitude + ',' + longitude,
              key: query.key,
              ...GoogleReverseGeocodingQuery,
            });
        } else {
          requestUrl =
            `${url}/place/nearbysearch/json?` +
            Qs.stringify({
              location: latitude + ',' + longitude,
              key: query.key,
              ...GooglePlacesSearchQuery,
            });
        }

        request.open('GET', requestUrl);

        request.withCredentials = requestShouldUseWithCredentials();
        setRequestHeaders(request, getRequestHeaders(props.requestUrl, false));

        request.send();
      } else {
        resultsRef.current = [];
        setDataSource(buildRowsFromResults([]));
      }
    },
    [
      _abortRequests,
      timeout,
      onTimeout,
      _disableRowLoaders,
      nearbyPlacesAPI,
      _filterResultsByTypes,
      filterReverseGeocodingByTypes,
      buildRowsFromResults,
      listViewDisplayedProp,
      onFail,
      url,
      query,
      GoogleReverseGeocodingQuery,
      GooglePlacesSearchQuery,
      requestShouldUseWithCredentials,
      props.requestUrl,
      getRequestHeaders,
    ],
  );

  const _request = (text) => {
    _abortRequests();

    if (!url) {
      return;
    }

    if (supportedPlatform() && text && text.length >= minLength) {
      const request = new XMLHttpRequest();
      requestsRef.current.push(request);

      request.timeout = timeout;
      request.ontimeout = onTimeout;

      // Track if request was aborted to avoid showing warnings for intentional aborts
      let requestAborted = false;
      request.onabort = () => {
        requestAborted = true;
      };

      request.onerror = () => {
        setListLoaderDisplayed(false);
        // Only show error if request wasn't intentionally aborted
        if (!requestAborted && request.status !== 0) {
          let errorMessage = 'Network error occurred';
          try {
            const responseText = request.responseText || '';
            if (responseText) {
              try {
                const responseJSON = JSON.parse(responseText);
                const extractedMessage = extractErrorMessage(responseJSON);
                errorMessage = extractedMessage;
              } catch (e) {
                // If JSON parsing fails, use raw text if available
                if (responseText.length > 0 && responseText.length < 500) {
                  errorMessage = responseText;
                }
              }
            }
          } catch (e) {
            // Keep default error message
          }

          // Always log the warning, and also call onFail if provided
          console.warn(`google places autocomplete: ${errorMessage}`);
          if (onFail) {
            onFail(errorMessage);
          }
        }
      };

      request.onreadystatechange = () => {
        if (request.readyState !== 4) {
          setListLoaderDisplayed(true);
          return;
        }

        setListLoaderDisplayed(false);

        // Skip processing if request was aborted
        if (requestAborted) {
          return;
        }

        if (request.status === 200) {
          try {
            const responseJSON = JSON.parse(request.responseText);

            if (typeof responseJSON.predictions !== 'undefined') {
              const results =
                nearbyPlacesAPI === 'GoogleReverseGeocoding'
                  ? _filterResultsByTypes(
                      responseJSON.predictions,
                      filterReverseGeocodingByTypes,
                    )
                  : responseJSON.predictions;

              resultsRef.current = results;
              const newDataSource = buildRowsFromResults(results, text);
              setDataSource(newDataSource);
              // Auto-show list when results arrive if in 'auto' mode
              if (
                listViewDisplayedProp === 'auto' &&
                newDataSource.length > 0
              ) {
                setListViewDisplayed(true);
              }
            }
            if (typeof responseJSON.suggestions !== 'undefined') {
              const results = _filterResultsByPlacePredictions(
                responseJSON.suggestions,
              );

              resultsRef.current = results;
              const newDataSource = buildRowsFromResults(results, text);
              setDataSource(newDataSource);
              // Auto-show list when results arrive if in 'auto' mode
              if (
                listViewDisplayedProp === 'auto' &&
                newDataSource.length > 0
              ) {
                setListViewDisplayed(true);
              }
            }
            // Check for errors in response (both legacy and new API formats)
            if (
              typeof responseJSON.error_message !== 'undefined' ||
              responseJSON.error
            ) {
              const errorMessage = extractErrorMessage(responseJSON);
              // Always log the warning, and also call onFail if provided
              console.warn(`google places autocomplete: ${errorMessage}`);
              if (onFail) {
                onFail(errorMessage);
              }
            }
          } catch (e) {
            // Always log the warning, and also call onFail if provided
            console.warn(
              'google places autocomplete: failed to parse response',
            );
            if (onFail) {
              onFail('failed to parse response');
            }
          }
        } else if (request.status !== 0) {
          // Only show warning for non-zero status codes (not aborted requests)
          // Status 0 typically means request was aborted or CORS blocked
          let errorMessage = `Request failed with status ${request.status}`;
          try {
            const responseText = request.responseText || '';
            if (responseText) {
              try {
                const responseJSON = JSON.parse(responseText);
                const extractedMessage = extractErrorMessage(responseJSON);
                errorMessage = extractedMessage;
              } catch (e) {
                // If JSON parsing fails, use raw text if available
                if (responseText.length > 0 && responseText.length < 500) {
                  errorMessage = responseText;
                }
              }
            }
          } catch (e) {
            // Keep default error message
          }

          // Always log the warning, and also call onFail if provided
          console.warn(`google places autocomplete: ${errorMessage}`);
          if (onFail) {
            onFail(errorMessage);
          }
        }
      };

      if (props.preProcess) {
        setStateText(props.preProcess(text));
      }

      if (isNewPlacesAPI) {
        // New Places API uses API key in headers, not query params
        request.open('POST', `${url}/v1/places:autocomplete`);
      } else {
        request.open(
          'GET',
          `${url}/place/autocomplete/json?input=` +
            encodeURIComponent(text) +
            '&' +
            Qs.stringify(query),
        );
      }

      request.withCredentials = requestShouldUseWithCredentials();
      setRequestHeaders(request, getRequestHeaders(props.requestUrl, false));

      if (isNewPlacesAPI) {
        const {
          key,
          locationbias,
          types,
          language,
          includedRegionCodes,
          includeQueryPredictions,
          ...rest
        } = query;

        // Build request body for new Places API
        const requestBody = {
          input: text,
          sessionToken,
        };

        // Map language to languageCode
        if (language) {
          requestBody.languageCode = language;
        }

        // Add includedRegionCodes if provided
        if (includedRegionCodes) {
          requestBody.includedRegionCodes = Array.isArray(includedRegionCodes)
            ? includedRegionCodes
            : [includedRegionCodes];
        }

        // Add includeQueryPredictions (default to true if not specified)
        requestBody.includeQueryPredictions =
          includeQueryPredictions !== undefined
            ? includeQueryPredictions
            : true;

        // Add any other query parameters that might be relevant
        Object.keys(rest).forEach((restKey) => {
          if (rest[restKey] !== undefined) {
            requestBody[restKey] = rest[restKey];
          }
        });

        request.send(JSON.stringify(requestBody));
      } else {
        request.send();
      }
    } else {
      resultsRef.current = [];
      setDataSource(buildRowsFromResults([]));
    }
  };

  const getCurrentLocation = useCallback(() => {
    let options = {
      enableHighAccuracy: false,
      timeout: 20000,
      maximumAge: 1000,
    };

    if (enableHighAccuracyLocation && Platform.OS === 'android') {
      options = {
        enableHighAccuracy: true,
        timeout: 20000,
      };
    }
    const getCurrentPosition =
      navigator.geolocation.getCurrentPosition ||
      navigator.geolocation.default?.getCurrentPosition;

    if (getCurrentPosition) {
      getCurrentPosition(
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

            _disableRowLoaders();
            onPress(currentLocationData, currentLocationData);
          } else {
            _requestNearby(position.coords.latitude, position.coords.longitude);
          }
        },
        (error) => {
          _disableRowLoaders();
          console.error(error.message);
        },
        options,
      );
    }
  }, [
    enableHighAccuracyLocation,
    currentLocationLabel,
    nearbyPlacesAPI,
    _disableRowLoaders,
    onPress,
    _requestNearby,
  ]);

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  const _enableRowLoader = (rowData) => {
    const rows = buildRowsFromResults(resultsRef.current);
    for (let i = 0; i < rows.length; i++) {
      if (
        rows[i].place_id === rowData.place_id ||
        (rows[i].isCurrentLocation === true &&
          rowData.isCurrentLocation === true)
      ) {
        rows[i].isLoading = true;
        setDataSource(rows);
        break;
      }
    }
  };

  const _disableRowLoaders = useCallback(() => {
    for (let i = 0; i < resultsRef.current.length; i++) {
      if (resultsRef.current[i].isLoading === true) {
        resultsRef.current[i].isLoading = false;
      }
    }

    setDataSource(buildRowsFromResults(resultsRef.current));
  }, [buildRowsFromResults]);

  const _onPress = (rowData) => {
    // Query predictions don't have place IDs, so they can't fetch details
    if (rowData.isQueryPrediction === true) {
      setStateText(_renderDescription(rowData));
      _onBlur();
      // For query predictions, pass the rowData as both data and details
      onPress(rowData, rowData);
      return;
    }

    if (rowData.isPredefinedPlace !== true && fetchDetails === true) {
      if (rowData.isLoading === true) {
        // already requesting
        return;
      }

      // Don't fetch details if there's no place_id
      if (!rowData.place_id) {
        setStateText(_renderDescription(rowData));
        _onBlur();
        onPress(rowData, rowData);
        return;
      }

      Keyboard.dismiss();

      _abortRequests();

      // display loader
      _enableRowLoader(rowData);

      // fetch details
      const request = new XMLHttpRequest();
      requestsRef.current.push(request);
      request.timeout = timeout;
      request.ontimeout = onTimeout;

      // Track if request was aborted to avoid showing warnings for intentional aborts
      let requestAborted = false;
      request.onabort = () => {
        requestAborted = true;
      };

      request.onerror = () => {
        _disableRowLoaders();
        // Only show error if request wasn't intentionally aborted
        if (!requestAborted && request.status !== 0) {
          let errorMessage = 'Network error occurred';
          try {
            const responseText = request.responseText || '';
            if (responseText) {
              try {
                const responseJSON = JSON.parse(responseText);
                const extractedMessage = extractErrorMessage(responseJSON);
                errorMessage = extractedMessage;
              } catch (e) {
                // If JSON parsing fails, use raw text if available
                if (responseText.length > 0 && responseText.length < 500) {
                  errorMessage = responseText;
                }
              }
            }
          } catch (e) {
            // Keep default error message
          }

          // Always log the warning, and also call onFail if provided
          console.warn(`google places autocomplete: ${errorMessage}`);
          if (onFail) {
            onFail(errorMessage);
          }
        }
      };

      request.onreadystatechange = () => {
        if (request.readyState !== 4) return;

        // Skip processing if request was aborted
        if (requestAborted) {
          return;
        }

        if (request.status === 200) {
          try {
            const responseJSON = JSON.parse(request.responseText);

            if (isNewPlacesAPI) {
              // New Places API returns place data directly (no status field)
              // Check if we have place data (id, name, formattedAddress, etc.)
              if (
                responseJSON.id ||
                responseJSON.name ||
                responseJSON.formattedAddress
              ) {
                const details = responseJSON;
                _disableRowLoaders();
                _onBlur();

                setStateText(_renderDescription(rowData));

                delete rowData.isLoading;
                onPress(rowData, details);
              } else if (responseJSON.error) {
                // Handle API errors
                _disableRowLoaders();
                if (autoFillOnNotFound) {
                  setStateText(_renderDescription(rowData));
                  delete rowData.isLoading;
                }
                if (!onNotFound) {
                  console.warn(
                    'google places autocomplete: ' +
                      JSON.stringify(responseJSON.error),
                  );
                } else {
                  onNotFound(responseJSON);
                }
              } else {
                // Unexpected response format
                _disableRowLoaders();
                if (autoFillOnNotFound) {
                  setStateText(_renderDescription(rowData));
                  delete rowData.isLoading;
                }
                if (!onNotFound) {
                  console.warn(
                    'google places autocomplete: unexpected response format',
                  );
                } else {
                  onNotFound(responseJSON);
                }
              }
            } else {
              // Legacy API handling
              if (responseJSON.status === 'OK') {
                const details = responseJSON.result;
                _disableRowLoaders();
                _onBlur();

                setStateText(_renderDescription(rowData));

                delete rowData.isLoading;
                onPress(rowData, details);
              } else {
                _disableRowLoaders();

                if (autoFillOnNotFound) {
                  setStateText(_renderDescription(rowData));
                  delete rowData.isLoading;
                }

                if (!onNotFound) {
                  console.warn(
                    'google places autocomplete: ' + responseJSON.status,
                  );
                } else {
                  onNotFound(responseJSON);
                }
              }
            }
          } catch (e) {
            _disableRowLoaders();
            // Always log the warning, and also call onFail if provided
            console.warn(
              'google places autocomplete: failed to parse response',
            );
            if (onFail) {
              onFail('failed to parse response');
            }
          }
        } else if (request.status !== 0) {
          // Only show warning for non-zero status codes (not aborted requests)
          // Status 0 typically means request was aborted or CORS blocked
          _disableRowLoaders();
          let errorMessage = `Request failed with status ${request.status}`;
          try {
            const responseText = request.responseText || '';
            if (responseText) {
              try {
                const responseJSON = JSON.parse(responseText);
                const extractedMessage = extractErrorMessage(responseJSON);
                errorMessage = extractedMessage;
              } catch (e) {
                // If JSON parsing fails, use raw text if available
                if (responseText.length > 0 && responseText.length < 500) {
                  errorMessage = responseText;
                }
              }
            }
          } catch (e) {
            // Keep default error message
          }

          // Always log the warning, and also call onFail if provided
          console.warn(`google places autocomplete: ${errorMessage}`);
          if (onFail) {
            onFail(errorMessage);
          }
        }
      };

      if (isNewPlacesAPI) {
        // New Places API uses places.googleapis.com endpoint
        // API key should be in headers, not query params
        const detailsUrl = url.includes('places.googleapis.com')
          ? url
          : 'https://places.googleapis.com';

        // Endpoint format: /v1/places/{placeId} where placeId is just the ID
        request.open(
          'GET',
          `${detailsUrl}/v1/places/${rowData.place_id}?` +
            Qs.stringify({
              sessionToken,
              fields,
            }),
        );
        setSessionToken(uuid.v4());
      } else {
        request.open(
          'GET',
          `${url}/place/details/json?` +
            Qs.stringify({
              key: query.key,
              placeid: rowData.place_id,
              language: query.language,
              ...GooglePlacesDetailsQuery,
            }),
        );
      }

      request.withCredentials = requestShouldUseWithCredentials();
      setRequestHeaders(request, getRequestHeaders(props.requestUrl, true));

      request.send();
    } else if (rowData.isCurrentLocation === true) {
      // display loader
      _enableRowLoader(rowData);

      setStateText(_renderDescription(rowData));

      delete rowData.isLoading;
      getCurrentLocation();
    } else {
      setStateText(_renderDescription(rowData));

      _onBlur();
      delete rowData.isLoading;
      const predefinedPlace = _getPredefinedPlace(rowData);

      // sending predefinedPlace as details for predefined places
      onPress(predefinedPlace, predefinedPlace);
    }
  };

  const _onChangeText = (text) => {
    setStateText(text);
    debounceData(text);
  };

  const _handleChangeText = (text) => {
    _onChangeText(text);

    const onChangeText = textInputProps?.onChangeText;

    if (onChangeText) {
      onChangeText(text);
    }
  };

  const isNewFocusInAutocompleteResultList = ({
    relatedTarget,
    currentTarget,
  }) => {
    if (!relatedTarget) return false;

    let node = relatedTarget.parentNode;

    while (node) {
      if (node.id === 'result-list-id') return true;
      node = node.parentNode;
    }

    return false;
  };

  const _onBlur = (e) => {
    if (e && isNewFocusInAutocompleteResultList(e)) return;

    if (!keepResultsAfterBlur) {
      setListViewDisplayed(false);
    }
    inputRef?.current?.blur();
  };

  const _onFocus = () => {
    setListViewDisplayed(true);
  };

  // ==========================================================================
  // RENDER FUNCTIONS
  // ==========================================================================

  const _renderDescription = (rowData) => {
    if (props.renderDescription) {
      return props.renderDescription(rowData);
    }

    return rowData.description || rowData.formatted_address || rowData.name;
  };

  const _getRowLoader = () => {
    return <ActivityIndicator animating={true} size='small' />;
  };

  const _renderLoader = (rowData) => {
    if (rowData.isLoading === true) {
      return (
        <View
          style={[
            suppressDefaultStyles ? {} : defaultStyles.loader,
            styles?.loader,
          ]}
        >
          {_getRowLoader()}
        </View>
      );
    }

    return null;
  };

  const _renderRowData = (rowData, index) => {
    if (props.renderRow) {
      return props.renderRow(rowData, index);
    }

    return (
      <Text
        style={[
          suppressDefaultStyles ? {} : defaultStyles.description,
          styles?.description,
          rowData.isPredefinedPlace ? styles?.predefinedPlacesDescription : {},
        ]}
        numberOfLines={numberOfLines}
      >
        {_renderDescription(rowData)}
      </Text>
    );
  };

  const _renderRow = (rowData = {}, index) => {
    return (
      <ScrollView
        contentContainerStyle={
          isRowScrollable ? { minWidth: '100%' } : { width: '100%' }
        }
        scrollEnabled={isRowScrollable}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={({ hovered, pressed }) => [
            isRowScrollable ? { minWidth: '100%' } : { width: '100%' },
            {
              backgroundColor: pressed
                ? listUnderlayColor
                : hovered
                ? listHoverColor
                : undefined,
            },
          ]}
          onPress={() => _onPress(rowData)}
          onBlur={_onBlur}
        >
          <View
            style={[
              suppressDefaultStyles ? {} : defaultStyles.row,
              styles?.row,
              rowData.isPredefinedPlace ? styles?.specialItemRow : {},
            ]}
          >
            {_renderLoader(rowData)}
            {_renderRowData(rowData, index)}
          </View>
        </Pressable>
      </ScrollView>
    );
  };

  const _renderSeparator = (sectionID, rowID) => {
    if (rowID === dataSource.length - 1) {
      return null;
    }

    return (
      <View
        key={`${sectionID}-${rowID}`}
        style={[
          suppressDefaultStyles ? {} : defaultStyles.separator,
          styles?.separator,
        ]}
      />
    );
  };

  const _shouldShowPoweredLogo = () => {
    if (!enablePoweredByContainer || dataSource.length === 0) {
      return false;
    }

    for (let i = 0; i < dataSource.length; i++) {
      const row = dataSource[i];

      if (!('isCurrentLocation' in row) && !('isPredefinedPlace' in row)) {
        return true;
      }
    }

    return false;
  };

  const _renderPoweredLogo = () => {
    if (!_shouldShowPoweredLogo()) {
      return null;
    }

    return (
      <View
        style={[
          suppressDefaultStyles ? {} : defaultStyles.row,
          defaultStyles.poweredContainer,
          styles?.poweredContainer,
        ]}
      >
        <Image
          style={[
            suppressDefaultStyles ? {} : defaultStyles.powered,
            styles?.powered,
          ]}
          resizeMode='contain'
          source={require('./images/powered_by_google_on_white.png')}
        />
      </View>
    );
  };

  const _renderLeftButton = () => {
    if (props.renderLeftButton) {
      return props.renderLeftButton();
    }
    return null;
  };

  const _renderRightButton = () => {
    if (props.renderRightButton) {
      return props.renderRightButton();
    }
    return null;
  };

  const _getFlatList = () => {
    const keyExtractor = (item, index) => {
      // Use stable keys based on item data
      if (item.place_id) {
        return `place_${item.place_id}_${index}`;
      }
      if (item.isCurrentLocation) {
        return 'current_location';
      }
      if (item.isPredefinedPlace && item.description) {
        return `predefined_${item.description}_${index}`;
      }
      // Fallback to index-based key (should rarely happen)
      return `item_${index}`;
    };

    // Show list if:
    // 1. Platform is supported
    // 2. There's data to show (dataSource has items)
    // 3. listViewDisplayed is true OR we're in 'auto' mode (auto-shows when data exists)
    const isAutoMode =
      listViewDisplayedProp === 'auto' || listViewDisplayedProp === undefined;
    const shouldShowList =
      supportedPlatform() &&
      dataSource.length > 0 &&
      (listViewDisplayed === true || isAutoMode);

    if (shouldShowList) {
      return (
        <FlatList
          nativeID='result-list-id'
          scrollEnabled={!disableScroll}
          nestedScrollEnabled={true}
          style={[
            suppressDefaultStyles ? {} : defaultStyles.listView,
            styles?.listView,
          ]}
          data={dataSource}
          keyExtractor={keyExtractor}
          extraData={[dataSource, props]}
          ItemSeparatorComponent={_renderSeparator}
          renderItem={({ item, index }) => _renderRow(item, index)}
          ListEmptyComponent={
            listLoaderDisplayed
              ? props.listLoaderComponent
              : stateText.length > minLength && props.listEmptyComponent
          }
          ListHeaderComponent={
            props.renderHeaderComponent &&
            props.renderHeaderComponent(stateText)
          }
          ListFooterComponent={_renderPoweredLogo}
          {...restProps}
        />
      );
    }

    return null;
  };

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  // Update query ref when query changes
  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  // Initialize URL from requestUrl prop
  useEffect(() => {
    setUrl(getRequestUrl(props.requestUrl));
  }, [props.requestUrl, getRequestUrl]);

  // Initialize dataSource on mount
  useEffect(() => {
    setDataSource(buildRowsFromResults([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep requestRef updated
  requestRef.current = _request;

  // Debounce setup
  const debounceData = useMemo(() => {
    return debounce((text) => requestRef.current(text), debounceMs);
  }, [debounceMs]);

  useEffect(() => {
    return () => {
      // Cleanup debounced function on unmount
      if (debounceData.cancel) {
        debounceData.cancel();
      }
    };
  }, [debounceData]);

  // Reload search when query changes (using string comparison to avoid object reference issues)
  useEffect(() => {
    const queryChanged = prevQueryStringRef.current !== queryString;

    if (queryChanged) {
      prevQueryStringRef.current = queryString;
      if (stateText && stateText.length >= minLength) {
        debounceData(stateText);
      }
    }

    return () => {
      _abortRequests();
    };
  }, [queryString, debounceData, stateText, minLength, _abortRequests]);

  // Auto-show list when dataSource has items in 'auto' mode
  useEffect(() => {
    if (
      listViewDisplayedProp === 'auto' &&
      dataSource.length > 0 &&
      !listViewDisplayed
    ) {
      setListViewDisplayed(true);
    }
  }, [dataSource.length, listViewDisplayedProp, listViewDisplayed]);

  // ==========================================================================
  // IMPERATIVE HANDLE
  // ==========================================================================

  useImperativeHandle(
    ref,
    () => ({
      setAddressText: (address) => {
        setStateText(address);
      },
      getAddressText: () => stateText,
      blur: () => inputRef.current?.blur(),
      focus: () => inputRef.current?.focus(),
      isFocused: () => inputRef.current?.isFocused(),
      clear: () => inputRef.current?.clear(),
      getCurrentLocation,
    }),
    [stateText, getCurrentLocation],
  );

  // ==========================================================================
  // MAIN RENDER
  // ==========================================================================

  const {
    onFocus: textInputOnFocus,
    onBlur: textInputOnBlur,
    onChangeText: textInputOnChangeText, // destructuring here stops this being set after onChangeText={_handleChangeText}
    clearButtonMode,
    InputComp,
    ...userProps
  } = textInputProps || {};
  const TextInputComp = InputComp || TextInput;

  return (
    <View
      style={[
        suppressDefaultStyles ? {} : defaultStyles.container,
        styles?.container,
      ]}
      pointerEvents='box-none'
    >
      {!textInputHide && (
        <View
          style={[
            suppressDefaultStyles ? {} : defaultStyles.textInputContainer,
            styles?.textInputContainer,
          ]}
        >
          {_renderLeftButton()}
          <TextInputComp
            ref={inputRef}
            style={[
              suppressDefaultStyles ? {} : defaultStyles.textInput,
              styles?.textInput,
            ]}
            value={stateText}
            placeholder={placeholder}
            onFocus={
              textInputOnFocus
                ? (e) => {
                    _onFocus();
                    textInputOnFocus(e);
                  }
                : _onFocus
            }
            onBlur={
              textInputOnBlur
                ? (e) => {
                    _onBlur(e);
                    textInputOnBlur(e);
                  }
                : _onBlur
            }
            clearButtonMode={clearButtonMode || 'while-editing'}
            onChangeText={_handleChangeText}
            {...userProps}
          />
          {_renderRightButton()}
        </View>
      )}
      {props.inbetweenCompo}
      {_getFlatList()}
      {props.children}
    </View>
  );
});

GooglePlacesAutocomplete.displayName = 'GooglePlacesAutocomplete';

export default { GooglePlacesAutocomplete };
