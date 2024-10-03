/* eslint-disable react-native/no-inline-styles */
import debounce from 'lodash.debounce';
import PropTypes from 'prop-types';
import Qs from 'qs';
import { v4 as uuidv4 } from 'uuid';
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
  listView: {},
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

export const GooglePlacesAutocomplete = forwardRef((props, ref) => {
  let _results = [];
  let _requests = [];

  const hasNavigator = () => {
    if (navigator?.geolocation) {
      return true;
    } else {
      console.warn(
        'If you are using React Native v0.60.0+ you must follow these instructions to enable currentLocation: https://git.io/Jf4AR',
      );
      return false;
    }
  };

  const buildRowsFromResults = useCallback(
    (results, text) => {
      let res = [];
      const shouldDisplayPredefinedPlaces = text
        ? results.length === 0 && text.length === 0
        : results.length === 0;
      if (
        shouldDisplayPredefinedPlaces ||
        props.predefinedPlacesAlwaysVisible === true
      ) {
        res = [
          ...props.predefinedPlaces.filter(
            (place) => place?.description.length,
          ),
        ];

        if (props.currentLocation === true && hasNavigator()) {
          res.unshift({
            description: props.currentLocationLabel,
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
      props.currentLocation,
      props.currentLocationLabel,
      props.predefinedPlaces,
      props.predefinedPlacesAlwaysVisible,
    ],
  );

  const getRequestUrl = useCallback((requestUrl) => {
    if (requestUrl) {
      if (requestUrl.useOnPlatform === 'all') {
        return requestUrl.url;
      }
      if (requestUrl.useOnPlatform === 'web') {
        return Platform.select({
          web: requestUrl.url,
          default: 'https://maps.googleapis.com/maps/api',
        });
      }
    } else {
      return 'https://maps.googleapis.com/maps/api';
    }
  }, []);

  const getRequestHeaders = (requestUrl) => {
    return requestUrl?.headers || {};
  };

  const setRequestHeaders = (request, headers) => {
    Object.keys(headers).map((headerKey) =>
      request.setRequestHeader(headerKey, headers[headerKey]),
    );
  };

  const [stateText, setStateText] = useState('');
  const [dataSource, setDataSource] = useState(buildRowsFromResults([]));
  const [listViewDisplayed, setListViewDisplayed] = useState(
    props.listViewDisplayed === 'auto' ? false : props.listViewDisplayed,
  );
  const [url, setUrl] = useState(getRequestUrl(props.requestUrl));
  const [listLoaderDisplayed, setListLoaderDisplayed] = useState(false);

  const inputRef = useRef();
  const [sessionToken, setSessionToken] = useState(uuidv4());
  useEffect(() => {
    setUrl(getRequestUrl(props.requestUrl));
  }, [getRequestUrl, props.requestUrl]);

  useEffect(() => {
    // This will load the search results after the query object ref gets changed
    _handleChangeText(stateText);
    return () => {
      _abortRequests();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.query]);

  useEffect(() => {
    // Update dataSource if props.predefinedPlaces changed
    setDataSource(buildRowsFromResults([]));
  }, [buildRowsFromResults, props.predefinedPlaces]);

  useImperativeHandle(ref, () => ({
    setAddressText: (address) => {
      setStateText(address);
    },
    getAddressText: () => stateText,
    blur: () => inputRef.current.blur(),
    focus: () => inputRef.current.focus(),
    isFocused: () => inputRef.current.isFocused(),
    clear: () => inputRef.current.clear(),
    getCurrentLocation,
  }));

  const requestShouldUseWithCredentials = () =>
    url === 'https://maps.googleapis.com/maps/api';

  const _abortRequests = () => {
    _requests.map((i) => {
      i.onreadystatechange = null;
      i.abort();
    });
    _requests = [];
  };

  const supportedPlatform = () => {
    if (Platform.OS === 'web' && !props.requestUrl) {
      console.warn(
        'This library cannot be used for the web unless you specify the requestUrl prop. See https://git.io/JflFv for more for details.',
      );
      return false;
    } else {
      return true;
    }
  };

  const getCurrentLocation = () => {
    let options = {
      enableHighAccuracy: false,
      timeout: 20000,
      maximumAge: 1000,
    };

    if (props.enableHighAccuracyLocation && Platform.OS === 'android') {
      options = {
        enableHighAccuracy: true,
        timeout: 20000,
      };
    }
    const getCurrentPosition =
      navigator.geolocation.getCurrentPosition ||
      navigator.geolocation.default.getCurrentPosition;

    getCurrentPosition &&
      getCurrentPosition(
        (position) => {
          if (props.nearbyPlacesAPI === 'None') {
            let currentLocation = {
              description: props.currentLocationLabel,
              geometry: {
                location: {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                },
              },
            };

            _disableRowLoaders();
            props.onPress(currentLocation, currentLocation);
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
  };

  const _onPress = (rowData) => {
    if (rowData.isPredefinedPlace !== true && props.fetchDetails === true) {
      if (rowData.isLoading === true) {
        // already requesting
        return;
      }

      Keyboard.dismiss();

      _abortRequests();

      // display loader
      _enableRowLoader(rowData);

      // fetch details
      const request = new XMLHttpRequest();
      _requests.push(request);
      request.timeout = props.timeout;
      request.ontimeout = props.onTimeout;
      request.onreadystatechange = () => {
        if (request.readyState !== 4) return;

        if (request.status === 200) {
          const responseJSON = JSON.parse(request.responseText);
          if (
            responseJSON.status === 'OK' ||
            (props.isNewPlacesAPI && responseJSON.id)
          ) {
            // if (_isMounted === true) {
            const details = props.isNewPlacesAPI
              ? responseJSON
              : responseJSON.result;
            _disableRowLoaders();
            _onBlur();

            setStateText(_renderDescription(rowData));

            delete rowData.isLoading;
            props.onPress(rowData, details);
            // }
          } else {
            _disableRowLoaders();

            if (props.autoFillOnNotFound) {
              setStateText(_renderDescription(rowData));
              delete rowData.isLoading;
            }

            if (!props.onNotFound) {
              console.warn(
                'google places autocomplete: ' + responseJSON.status,
              );
            } else {
              props.onNotFound(responseJSON);
            }
          }
        } else {
          _disableRowLoaders();

          if (!props.onFail) {
            console.warn(
              'google places autocomplete: request could not be completed or has been aborted',
            );
          } else {
            props.onFail('request could not be completed or has been aborted');
          }
        }
      };

      if (props.isNewPlacesAPI) {
        request.open(
          'GET',
          `${url}/v1/places/${rowData.place_id}?` +
            Qs.stringify({
              key: props.query.key,
              sessionToken,
              fields: props.fields,
            }),
        );
        setSessionToken(uuidv4());
      } else {
        request.open(
          'GET',
          `${url}/place/details/json?` +
            Qs.stringify({
              key: props.query.key,
              placeid: rowData.place_id,
              language: props.query.language,
              ...props.GooglePlacesDetailsQuery,
            }),
        );
      }

      request.withCredentials = requestShouldUseWithCredentials();
      setRequestHeaders(request, getRequestHeaders(props.requestUrl));

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
      let predefinedPlace = _getPredefinedPlace(rowData);

      // sending predefinedPlace as details for predefined places
      props.onPress(predefinedPlace, predefinedPlace);
    }
  };

  const _enableRowLoader = (rowData) => {
    let rows = buildRowsFromResults(_results);
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

  const _disableRowLoaders = () => {
    // if (_isMounted === true) {
    for (let i = 0; i < _results.length; i++) {
      if (_results[i].isLoading === true) {
        _results[i].isLoading = false;
      }
    }

    setDataSource(buildRowsFromResults(_results));
    // }
  };

  const _getPredefinedPlace = (rowData) => {
    if (rowData.isPredefinedPlace !== true) {
      return rowData;
    }

    for (let i = 0; i < props.predefinedPlaces.length; i++) {
      if (props.predefinedPlaces[i].description === rowData.description) {
        return props.predefinedPlaces[i];
      }
    }

    return rowData;
  };

  const _filterResultsByTypes = (unfilteredResults, types) => {
    if (types.length === 0) return unfilteredResults;

    const results = [];
    for (let i = 0; i < unfilteredResults.length; i++) {
      let found = false;

      for (let j = 0; j < types.length; j++) {
        if (unfilteredResults[i].types.indexOf(types[j]) !== -1) {
          found = true;
          break;
        }
      }

      if (found === true) {
        results.push(unfilteredResults[i]);
      }
    }
    return results;
  };

  const _filterResultsByPlacePredictions = (unfilteredResults) => {
    const results = [];
    for (let i = 0; i < unfilteredResults.length; i++) {
      if (unfilteredResults[i].placePrediction) {
        results.push({
          description: unfilteredResults[i].placePrediction.text?.text,
          place_id: unfilteredResults[i].placePrediction.placeId,
          reference: unfilteredResults[i].placePrediction.placeId,
          structured_formatting: {
            main_text:
              unfilteredResults[i].placePrediction.structuredFormat?.mainText
                ?.text,
            secondary_text:
              unfilteredResults[i].placePrediction.structuredFormat
                ?.secondaryText?.text,
          },
          types: unfilteredResults[i].placePrediction.types ?? [],
        });
      }
    }
    return results;
  };

  const _requestNearby = (latitude, longitude) => {
    _abortRequests();

    if (
      latitude !== undefined &&
      longitude !== undefined &&
      latitude !== null &&
      longitude !== null
    ) {
      const request = new XMLHttpRequest();
      _requests.push(request);
      request.timeout = props.timeout;
      request.ontimeout = props.onTimeout;
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
            // if (_isMounted === true) {
            var results = [];
            if (props.nearbyPlacesAPI === 'GoogleReverseGeocoding') {
              results = _filterResultsByTypes(
                responseJSON.results,
                props.filterReverseGeocodingByTypes,
              );
            } else {
              results = responseJSON.results;
            }

            setDataSource(buildRowsFromResults(results));
            // }
          }
          if (typeof responseJSON.error_message !== 'undefined') {
            if (!props.onFail)
              console.warn(
                'google places autocomplete: ' + responseJSON.error_message,
              );
            else {
              props.onFail(responseJSON.error_message);
            }
          }
        } else {
          // console.warn("google places autocomplete: request could not be completed or has been aborted");
        }
      };

      let requestUrl = '';
      if (props.nearbyPlacesAPI === 'GoogleReverseGeocoding') {
        // your key must be allowed to use Google Maps Geocoding API
        requestUrl =
          `${url}/geocode/json?` +
          Qs.stringify({
            latlng: latitude + ',' + longitude,
            key: props.query.key,
            ...props.GoogleReverseGeocodingQuery,
          });
      } else {
        requestUrl =
          `${url}/place/nearbysearch/json?` +
          Qs.stringify({
            location: latitude + ',' + longitude,
            key: props.query.key,
            ...props.GooglePlacesSearchQuery,
          });
      }

      request.open('GET', requestUrl);

      request.withCredentials = requestShouldUseWithCredentials();
      setRequestHeaders(request, getRequestHeaders(props.requestUrl));

      request.send();
    } else {
      _results = [];
      setDataSource(buildRowsFromResults([]));
    }
  };

  const _request = (text) => {
    _abortRequests();
    if (!url) {
      return;
    }
    if (supportedPlatform() && text && text.length >= props.minLength) {
      const request = new XMLHttpRequest();
      _requests.push(request);
      request.timeout = props.timeout;
      request.ontimeout = props.onTimeout;
      request.onreadystatechange = () => {
        if (request.readyState !== 4) {
          setListLoaderDisplayed(true);
          return;
        }

        setListLoaderDisplayed(false);
        if (request.status === 200) {
          const responseJSON = JSON.parse(request.responseText);

          if (typeof responseJSON.predictions !== 'undefined') {
            // if (_isMounted === true) {
            const results =
              props.nearbyPlacesAPI === 'GoogleReverseGeocoding'
                ? _filterResultsByTypes(
                    responseJSON.predictions,
                    props.filterReverseGeocodingByTypes,
                  )
                : responseJSON.predictions;

            _results = results;
            setDataSource(buildRowsFromResults(results, text));
            // }
          }
          if (typeof responseJSON.suggestions !== 'undefined') {
            const results = _filterResultsByPlacePredictions(
              responseJSON.suggestions,
            );

            _results = results;
            setDataSource(buildRowsFromResults(results, text));
          }
          if (typeof responseJSON.error_message !== 'undefined') {
            if (!props.onFail)
              console.warn(
                'google places autocomplete: ' + responseJSON.error_message,
              );
            else {
              props.onFail(responseJSON.error_message);
            }
          }
        } else {
          // console.warn("google places autocomplete: request could not be completed or has been aborted");
        }
      };

      if (props.preProcess) {
        setStateText(props.preProcess(text));
      }

      if (props.isNewPlacesAPI) {
        const keyQueryParam = props.query.key
          ? '?' +
            Qs.stringify({
              key: props.query.key,
            })
          : '';
        request.open('POST', `${url}/v1/places:autocomplete${keyQueryParam}`);
      } else {
        request.open(
          'GET',
          `${url}/place/autocomplete/json?input=` +
            encodeURIComponent(text) +
            '&' +
            Qs.stringify(props.query),
        );
      }

      request.withCredentials = requestShouldUseWithCredentials();
      setRequestHeaders(request, getRequestHeaders(props.requestUrl));

      if (props.isNewPlacesAPI) {
        const { key, locationbias, types, ...rest } = props.query;
        request.send(
          JSON.stringify({
            input: text,
            sessionToken,
            ...rest,
          }),
        );
      } else {
        request.send();
      }
    } else {
      _results = [];
      setDataSource(buildRowsFromResults([]));
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debounceData = useMemo(() => debounce(_request, props.debounce), [
    props.query,
    url,
  ]);

  const _onChangeText = (text) => {
    setStateText(text);
    debounceData(text);
  };

  const _handleChangeText = (text) => {
    _onChangeText(text);

    const onChangeText = props?.textInputProps?.onChangeText;

    if (onChangeText) {
      onChangeText(text);
    }
  };

  const _getRowLoader = () => {
    return <ActivityIndicator animating={true} size='small' />;
  };

  const _renderRowData = (rowData, index) => {
    if (props.renderRow) {
      return props.renderRow(rowData, index);
    }

    return (
      <Text
        style={[
          props.suppressDefaultStyles ? {} : defaultStyles.description,
          props.styles.description,
          rowData.isPredefinedPlace
            ? props.styles.predefinedPlacesDescription
            : {},
        ]}
        numberOfLines={props.numberOfLines}
      >
        {_renderDescription(rowData)}
      </Text>
    );
  };

  const _renderDescription = (rowData) => {
    if (props.renderDescription) {
      return props.renderDescription(rowData);
    }

    return rowData.description || rowData.formatted_address || rowData.name;
  };

  const _renderLoader = (rowData) => {
    if (rowData.isLoading === true) {
      return (
        <View
          style={[
            props.suppressDefaultStyles ? {} : defaultStyles.loader,
            props.styles.loader,
          ]}
        >
          {_getRowLoader()}
        </View>
      );
    }

    return null;
  };

  const _renderRow = (rowData = {}, index) => {
    return (
      <ScrollView
        contentContainerStyle={
          props.isRowScrollable ? { minWidth: '100%' } : { width: '100%' }
        }
        scrollEnabled={props.isRowScrollable}
        keyboardShouldPersistTaps={props.keyboardShouldPersistTaps}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={({ hovered, pressed }) => [
            props.isRowScrollable ? { minWidth: '100%' } : { width: '100%' },
            {
              backgroundColor: pressed
                ? props.listUnderlayColor
                : hovered
                ? props.listHoverColor
                : undefined,
            },
          ]}
          onPress={() => _onPress(rowData)}
          onBlur={_onBlur}
        >
          <View
            style={[
              props.suppressDefaultStyles ? {} : defaultStyles.row,
              props.styles.row,
              rowData.isPredefinedPlace ? props.styles.specialItemRow : {},
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
          props.suppressDefaultStyles ? {} : defaultStyles.separator,
          props.styles.separator,
        ]}
      />
    );
  };

  const isNewFocusInAutocompleteResultList = ({
    relatedTarget,
    currentTarget,
  }) => {
    if (!relatedTarget) return false;

    var node = relatedTarget.parentNode;

    while (node) {
      if (node.id === 'result-list-id') return true;
      node = node.parentNode;
    }

    return false;
  };

  const _onBlur = (e) => {
    if (e && isNewFocusInAutocompleteResultList(e)) return;

    if (!props.keepResultsAfterBlur) {
      setListViewDisplayed(false);
    }
    inputRef?.current?.blur();
  };

  const _onFocus = () => setListViewDisplayed(true);

  const _renderPoweredLogo = () => {
    if (!_shouldShowPoweredLogo()) {
      return null;
    }

    return (
      <View
        style={[
          props.suppressDefaultStyles ? {} : defaultStyles.row,
          defaultStyles.poweredContainer,
          props.styles.poweredContainer,
        ]}
      >
        <Image
          style={[
            props.suppressDefaultStyles ? {} : defaultStyles.powered,
            props.styles.powered,
          ]}
          resizeMode='contain'
          source={require('./images/powered_by_google_on_white.png')}
        />
      </View>
    );
  };

  const _shouldShowPoweredLogo = () => {
    if (!props.enablePoweredByContainer || dataSource.length === 0) {
      return false;
    }

    for (let i = 0; i < dataSource.length; i++) {
      let row = dataSource[i];

      if (
        !row.hasOwnProperty('isCurrentLocation') &&
        !row.hasOwnProperty('isPredefinedPlace')
      ) {
        return true;
      }
    }

    return false;
  };

  const _renderLeftButton = () => {
    if (props.renderLeftButton) {
      return props.renderLeftButton();
    }
  };

  const _renderRightButton = () => {
    if (props.renderRightButton) {
      return props.renderRightButton();
    }
  };

  const _getFlatList = () => {
    const keyGenerator = () => Math.random().toString(36).substr(2, 10);

    if (
      supportedPlatform() &&
      (stateText !== '' ||
        props.predefinedPlaces.length > 0 ||
        props.currentLocation === true) &&
      listViewDisplayed === true
    ) {
      return (
        <FlatList
          nativeID='result-list-id'
          scrollEnabled={!props.disableScroll}
          style={[
            props.suppressDefaultStyles ? {} : defaultStyles.listView,
            props.styles.listView,
          ]}
          data={dataSource}
          keyExtractor={keyGenerator}
          extraData={[dataSource, props]}
          ItemSeparatorComponent={_renderSeparator}
          renderItem={({ item, index }) => _renderRow(item, index)}
          ListEmptyComponent={
            listLoaderDisplayed
              ? props.listLoaderComponent
              : stateText.length > props.minLength && props.listEmptyComponent
          }
          ListHeaderComponent={
            props.renderHeaderComponent &&
            props.renderHeaderComponent(stateText)
          }
          ListFooterComponent={_renderPoweredLogo}
          {...props}
        />
      );
    }

    return null;
  };

  let {
    onFocus,
    onBlur,
    onChangeText, // destructuring here stops this being set after onChangeText={_handleChangeText}
    clearButtonMode,
    InputComp,
    ...userProps
  } = props.textInputProps;
  const TextInputComp = InputComp || TextInput;
  return (
    <View
      style={[
        props.suppressDefaultStyles ? {} : defaultStyles.container,
        props.styles.container,
      ]}
      pointerEvents='box-none'
    >
      {!props.textInputHide && (
        <View
          style={[
            props.suppressDefaultStyles ? {} : defaultStyles.textInputContainer,
            props.styles.textInputContainer,
          ]}
        >
          {_renderLeftButton()}
          <TextInputComp
            ref={inputRef}
            style={[
              props.suppressDefaultStyles ? {} : defaultStyles.textInput,
              props.styles.textInput,
            ]}
            value={stateText}
            placeholder={props.placeholder}
            onFocus={
              onFocus
                ? (e) => {
                    _onFocus();
                    onFocus(e);
                  }
                : _onFocus
            }
            onBlur={
              onBlur
                ? (e) => {
                    _onBlur(e);
                    onBlur(e);
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

GooglePlacesAutocomplete.propTypes = {
  autoFillOnNotFound: PropTypes.bool,
  currentLocation: PropTypes.bool,
  currentLocationLabel: PropTypes.string,
  debounce: PropTypes.number,
  disableScroll: PropTypes.bool,
  enableHighAccuracyLocation: PropTypes.bool,
  enablePoweredByContainer: PropTypes.bool,
  fetchDetails: PropTypes.bool,
  filterReverseGeocodingByTypes: PropTypes.array,
  GooglePlacesDetailsQuery: PropTypes.object,
  GooglePlacesSearchQuery: PropTypes.object,
  GoogleReverseGeocodingQuery: PropTypes.object,
  inbetweenCompo: PropTypes.object,
  isRowScrollable: PropTypes.bool,
  keyboardShouldPersistTaps: PropTypes.oneOf(['never', 'always', 'handled']),
  listEmptyComponent: PropTypes.element,
  listLoaderComponent: PropTypes.element,
  listHoverColor: PropTypes.string,
  listUnderlayColor: PropTypes.string,
  // Must write it this way: https://stackoverflow.com/a/54290946/7180620
  listViewDisplayed: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.oneOf(['auto']),
  ]),
  keepResultsAfterBlur: PropTypes.bool,
  minLength: PropTypes.number,
  nearbyPlacesAPI: PropTypes.string,
  numberOfLines: PropTypes.number,
  onFail: PropTypes.func,
  onNotFound: PropTypes.func,
  onPress: PropTypes.func,
  onTimeout: PropTypes.func,
  placeholder: PropTypes.string,
  predefinedPlaces: PropTypes.array,
  predefinedPlacesAlwaysVisible: PropTypes.bool,
  preProcess: PropTypes.func,
  query: PropTypes.object,
  renderDescription: PropTypes.func,
  renderHeaderComponent: PropTypes.func,
  renderLeftButton: PropTypes.func,
  renderRightButton: PropTypes.func,
  renderRow: PropTypes.func,
  requestUrl: PropTypes.shape({
    url: PropTypes.string,
    useOnPlatform: PropTypes.oneOf(['web', 'all']),
    headers: PropTypes.objectOf(PropTypes.string),
  }),
  styles: PropTypes.object,
  suppressDefaultStyles: PropTypes.bool,
  textInputHide: PropTypes.bool,
  textInputProps: PropTypes.object,
  timeout: PropTypes.number,
  isNewPlacesAPI: PropTypes.bool,
  fields: PropTypes.string,
};

GooglePlacesAutocomplete.defaultProps = {
  autoFillOnNotFound: false,
  currentLocation: false,
  currentLocationLabel: 'Current location',
  debounce: 0,
  disableScroll: false,
  enableHighAccuracyLocation: true,
  enablePoweredByContainer: true,
  fetchDetails: false,
  filterReverseGeocodingByTypes: [],
  GooglePlacesDetailsQuery: {},
  GooglePlacesSearchQuery: {
    rankby: 'distance',
    type: 'restaurant',
  },
  GoogleReverseGeocodingQuery: {},
  isRowScrollable: true,
  keyboardShouldPersistTaps: 'always',
  listHoverColor: '#ececec',
  listUnderlayColor: '#c8c7cc',
  listViewDisplayed: 'auto',
  keepResultsAfterBlur: false,
  minLength: 0,
  nearbyPlacesAPI: 'GooglePlacesSearch',
  numberOfLines: 1,
  onFail: () => {},
  onNotFound: () => {},
  onPress: () => {},
  onTimeout: () => console.warn('google places autocomplete: request timeout'),
  placeholder: '',
  predefinedPlaces: [],
  predefinedPlacesAlwaysVisible: false,
  query: {
    key: 'missing api key',
    language: 'en',
    types: 'geocode',
  },
  styles: {},
  suppressDefaultStyles: false,
  textInputHide: false,
  textInputProps: {},
  timeout: 20000,
  isNewPlacesAPI: false,
  fields: '*',
};

GooglePlacesAutocomplete.displayName = 'GooglePlacesAutocomplete';

export default { GooglePlacesAutocomplete };
