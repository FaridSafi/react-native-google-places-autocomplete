/* eslint-disable react-native/no-inline-styles */
import debounce from 'lodash.debounce';
import PropTypes from 'prop-types';
import Qs from 'qs';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableHighlight,
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
    height: 0.5,
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
  const _results = useRef([]);
  const _requests = useRef([]);

  const hasNavigator = useCallback(() => {
    if (navigator?.geolocation) {
      return true;
    } else {
      console.warn(
        'If you are using React Native v0.60.0+ you must follow these instructions to enable currentLocation: https://git.io/Jf4AR'
      );
      return false;
    }
  }, []);

  const buildRowsFromResults = useCallback(
    (results) => {
      let res = [];

      if (results.length === 0 || props.predefinedPlacesAlwaysVisible === true) {
        res = [...props.predefinedPlaces.filter((place) => place?.description.length)];

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
    [hasNavigator, props.currentLocation, props.currentLocationLabel, props.predefinedPlaces, props.predefinedPlacesAlwaysVisible]
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

  const getRequestHeaders = useCallback((requestUrl) => {
    return requestUrl?.headers || {};
  }, []);

  const setRequestHeaders = useCallback((request, headers) => {
    Object.keys(headers).map((headerKey) => request.setRequestHeader(headerKey, headers[headerKey]));
  }, []);

  const [stateText, setStateText] = useState('');
  const [dataSource, setDataSource] = useState(buildRowsFromResults([]));
  const [listViewDisplayed, setListViewDisplayed] = useState(props.listViewDisplayed === 'auto' ? false : props.listViewDisplayed);
  const [url] = useState(getRequestUrl(props.requestUrl));

  const inputRef = useRef();

  useEffect(() => {
    // This will load the default value's search results after the view has
    // been rendered
    _handleChangeText(stateText);
    return () => {
      _abortRequests();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    // Update dataSource if props.predefinedPlaces changed
    setDataSource(buildRowsFromResults([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.predefinedPlaces]);

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

  const requestShouldUseWithCredentials = useCallback(() => url === 'https://maps.googleapis.com/maps/api', [url]);

  const _abortRequests = useCallback(() => {
    _requests.current.map((i) => i.abort());
    _requests.current = [];
  }, [_requests]);

  const supportedPlatform = useCallback(() => {
    if (Platform.OS === 'web' && !props.requestUrl) {
      console.warn(
        'This library cannot be used for the web unless you specify the requestUrl prop. See https://git.io/JflFv for more for details.'
      );
      return false;
    } else {
      return true;
    }
  }, [props.requestUrl]);

  const getCurrentLocation = useCallback(() => {
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
    const getCurrentPosition = navigator.geolocation.getCurrentPosition || navigator.geolocation.default.getCurrentPosition;

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
        options
      );
  }, [_disableRowLoaders, _requestNearby, props]);

  const _onPress = useCallback(
    (rowData) => {
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
        _requests.current.push(request);
        request.timeout = props.timeout;
        request.ontimeout = props.onTimeout;
        request.onreadystatechange = () => {
          if (request.readyState !== 4) {
            return;
          }

          if (request.status === 200) {
            const responseJSON = JSON.parse(request.responseText);

            if (responseJSON.status === 'OK') {
              // if (_isMounted === true) {
              const details = responseJSON.result;
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
                console.warn('google places autocomplete: ' + responseJSON.status);
              } else {
                props.onNotFound(responseJSON);
              }
            }
          } else {
            _disableRowLoaders();

            if (!props.onFail) {
              console.warn('google places autocomplete: request could not be completed or has been aborted');
            } else {
              props.onFail('request could not be completed or has been aborted');
            }
          }
        };

        request.open(
          'GET',
          `${url}/place/details/json?` +
            Qs.stringify({
              key: props.query.key,
              placeid: rowData.place_id,
              language: props.query.language,
              ...props.GooglePlacesDetailsQuery,
            })
        );

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
    },
    [
      _abortRequests,
      _disableRowLoaders,
      _enableRowLoader,
      _getPredefinedPlace,
      _onBlur,
      _renderDescription,
      getCurrentLocation,
      getRequestHeaders,
      props,
      requestShouldUseWithCredentials,
      setRequestHeaders,
      url,
    ]
  );

  const _enableRowLoader = useCallback(
    (rowData) => {
      let rows = buildRowsFromResults(_results.current);
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].place_id === rowData.place_id || (rows[i].isCurrentLocation === true && rowData.isCurrentLocation === true)) {
          rows[i].isLoading = true;
          setDataSource(rows);
          break;
        }
      }
    },
    [buildRowsFromResults]
  );

  const _disableRowLoaders = useCallback(() => {
    // if (_isMounted === true) {
    for (let i = 0; i < _results.current.length; i++) {
      if (_results.current[i].isLoading === true) {
        _results.current[i].isLoading = false;
      }
    }

    setDataSource(buildRowsFromResults(_results.current));
    // }
  }, [buildRowsFromResults]);

  const _getPredefinedPlace = useCallback(
    (rowData) => {
      if (rowData.isPredefinedPlace !== true) {
        return rowData;
      }

      for (let i = 0; i < props.predefinedPlaces.length; i++) {
        if (props.predefinedPlaces[i].description === rowData.description) {
          return props.predefinedPlaces[i];
        }
      }

      return rowData;
    },
    [props.predefinedPlaces]
  );

  const _filterResultsByTypes = useCallback((unfilteredResults, types) => {
    if (types.length === 0) {
      return unfilteredResults;
    }

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
  }, []);

  const _requestNearby = useCallback(
    (latitude, longitude) => {
      _abortRequests();

      if (latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null) {
        const request = new XMLHttpRequest();
        _requests.current.push(request);
        request.timeout = props.timeout;
        request.ontimeout = props.onTimeout;
        request.onreadystatechange = () => {
          if (request.readyState !== 4) {
            return;
          }

          if (request.status === 200) {
            const responseJSON = JSON.parse(request.responseText);

            _disableRowLoaders();

            if (typeof responseJSON.results !== 'undefined') {
              // if (_isMounted === true) {
              var results = [];
              if (props.nearbyPlacesAPI === 'GoogleReverseGeocoding') {
                results = _filterResultsByTypes(responseJSON.results, props.filterReverseGeocodingByTypes);
              } else {
                results = responseJSON.results;
              }

              setDataSource(buildRowsFromResults(results));
              // }
            }
            if (typeof responseJSON.error_message !== 'undefined') {
              if (!props.onFail) {
                console.warn('google places autocomplete: ' + responseJSON.error_message);
              } else {
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
        _results.current = [];
        setDataSource(buildRowsFromResults([]));
      }
    },
    [
      _abortRequests,
      _disableRowLoaders,
      _filterResultsByTypes,
      buildRowsFromResults,
      getRequestHeaders,
      props,
      requestShouldUseWithCredentials,
      setRequestHeaders,
      url,
    ]
  );

  const _request = useCallback(
    (text) => {
      _abortRequests();
      if (supportedPlatform() && text && text.length >= props.minLength) {
        const request = new XMLHttpRequest();
        _requests.current.push(request);
        request.timeout = props.timeout;
        request.ontimeout = props.onTimeout;
        request.onreadystatechange = () => {
          if (request.readyState !== 4) {
            return;
          }

          if (request.status === 200) {
            const responseJSON = JSON.parse(request.responseText);
            if (typeof responseJSON.predictions !== 'undefined') {
              // if (_isMounted === true) {
              const results =
                props.nearbyPlacesAPI === 'GoogleReverseGeocoding'
                  ? _filterResultsByTypes(responseJSON.predictions, props.filterReverseGeocodingByTypes)
                  : responseJSON.predictions;

              _results.current = results;
              setDataSource(buildRowsFromResults(results));
              // }
            }
            if (typeof responseJSON.error_message !== 'undefined') {
              if (!props.onFail) {
                console.warn('google places autocomplete: ' + responseJSON.error_message);
              } else {
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

        console.log(props);
        request.open('GET', `${url}/place/autocomplete/json?input=` + encodeURIComponent(text) + '&' + Qs.stringify(props.query));

        request.withCredentials = requestShouldUseWithCredentials();
        setRequestHeaders(request, getRequestHeaders(props.requestUrl));

        request.send();
      } else {
        _results.current = [];
        setDataSource(buildRowsFromResults([]));
      }
    },
    [
      _abortRequests,
      _filterResultsByTypes,
      buildRowsFromResults,
      getRequestHeaders,
      props,
      requestShouldUseWithCredentials,
      setRequestHeaders,
      supportedPlatform,
      url,
    ]
  );

  const debounceData = useMemo(() => {
    return debounce(_request, props.debounce);
  }, [props.debounce, _request]);

  const _onChangeText = useCallback(
    (text) => {
      setStateText(text);
      debounceData(text);
    },
    [debounceData]
  );

  const _handleChangeText = useCallback(
    (text) => {
      _onChangeText(text);

      const onChangeText = props?.textInputProps?.onChangeText;

      if (onChangeText) {
        onChangeText(text);
      }
    },
    [_onChangeText, props]
  );

  const _getRowLoader = useCallback(() => {
    return <ActivityIndicator animating={true} size='small' />;
  }, []);

  const _renderRowData = useCallback(
    (rowData, index) => {
      if (props.renderRow) {
        return props.renderRow(rowData, index);
      }

      return (
        <Text
          style={[
            props.suppressDefaultStyles ? {} : defaultStyles.description,
            props.styles.description,
            rowData.isPredefinedPlace ? props.styles.predefinedPlacesDescription : {},
          ]}
          numberOfLines={props.numberOfLines}>
          {_renderDescription(rowData)}
        </Text>
      );
    },
    [_renderDescription, props]
  );

  const _renderDescription = useCallback(
    (rowData) => {
      if (props.renderDescription) {
        return props.renderDescription(rowData);
      }

      return rowData.description || rowData.formatted_address || rowData.name;
    },
    [props]
  );

  const _renderLoader = useCallback(
    (rowData) => {
      if (rowData.isLoading === true) {
        return <View style={[props.suppressDefaultStyles ? {} : defaultStyles.loader, props.styles.loader]}>{_getRowLoader()}</View>;
      }

      return null;
    },
    [_getRowLoader, props.styles.loader, props.suppressDefaultStyles]
  );

  const _renderRow = useCallback(
    (rowData = {}, index) => {
      return (
        <ScrollView
          contentContainerStyle={props.isRowScrollable ? { minWidth: '100%' } : { width: '100%' }}
          scrollEnabled={props.isRowScrollable}
          keyboardShouldPersistTaps={props.keyboardShouldPersistTaps}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}>
          <TouchableHighlight
            style={props.isRowScrollable ? { minWidth: '100%' } : { width: '100%' }}
            onPress={() => _onPress(rowData)}
            underlayColor={props.listUnderlayColor || '#c8c7cc'}>
            <View
              style={[
                props.suppressDefaultStyles ? {} : defaultStyles.row,
                props.styles.row,
                rowData.isPredefinedPlace ? props.styles.specialItemRow : {},
              ]}>
              {_renderLoader(rowData)}
              {_renderRowData(rowData, index)}
            </View>
          </TouchableHighlight>
        </ScrollView>
      );
    },
    [
      _onPress,
      _renderLoader,
      _renderRowData,
      props.isRowScrollable,
      props.keyboardShouldPersistTaps,
      props.listUnderlayColor,
      props.styles.row,
      props.styles.specialItemRow,
      props.suppressDefaultStyles,
    ]
  );

  const _renderSeparator = useCallback(
    (sectionID, rowID) => {
      if (rowID === dataSource.length - 1) {
        return null;
      }

      return (
        <View key={`${sectionID}-${rowID}`} style={[props.suppressDefaultStyles ? {} : defaultStyles.separator, props.styles.separator]} />
      );
    },
    [dataSource.length, props.styles.separator, props.suppressDefaultStyles]
  );

  const isNewFocusInAutocompleteResultList = useCallback(({ relatedTarget, currentTarget }) => {
    if (!relatedTarget) {
      return false;
    }

    var node = relatedTarget.parentNode;

    while (node) {
      if (node.id === 'result-list-id') {
        return true;
      }
      node = node.parentNode;
    }

    return false;
  }, []);

  const _onBlur = useCallback(
    (e) => {
      if (e && isNewFocusInAutocompleteResultList(e)) {
        return;
      }

      if (!props.keepResultsAfterBlur) {
        setListViewDisplayed(false);
      }
      inputRef?.current?.blur();
    },
    [isNewFocusInAutocompleteResultList, props.keepResultsAfterBlur]
  );

  const _onFocus = useCallback(() => setListViewDisplayed(true), []);

  const _renderPoweredLogo = useCallback(() => {
    if (!_shouldShowPoweredLogo()) {
      return null;
    }

    return (
      <View style={[props.suppressDefaultStyles ? {} : defaultStyles.row, defaultStyles.poweredContainer, props.styles.poweredContainer]}>
        <Image
          style={[props.suppressDefaultStyles ? {} : defaultStyles.powered, props.styles.powered]}
          resizeMode='contain'
          source={require('./images/powered_by_google_on_white.png')}
        />
      </View>
    );
  }, [_shouldShowPoweredLogo, props.styles.powered, props.styles.poweredContainer, props.suppressDefaultStyles]);

  const _shouldShowPoweredLogo = useCallback(() => {
    if (!props.enablePoweredByContainer || dataSource.length === 0) {
      return false;
    }

    for (let i = 0; i < dataSource.length; i++) {
      let row = dataSource[i];

      if (!row.hasOwnProperty('isCurrentLocation') && !row.hasOwnProperty('isPredefinedPlace')) {
        return true;
      }
    }

    return false;
  }, [dataSource, props.enablePoweredByContainer]);

  const _renderLeftButton = useCallback(() => {
    if (props.renderLeftButton) {
      return props.renderLeftButton();
    }
  }, [props]);

  const _renderRightButton = useCallback(() => {
    if (props.renderRightButton) {
      return props.renderRightButton();
    }
  }, [props]);

  const _getFlatList = useCallback(() => {
    const keyGenerator = () => Math.random().toString(36).substr(2, 10);

    if (
      supportedPlatform() &&
      (stateText !== '' || props.predefinedPlaces.length > 0 || props.currentLocation === true) &&
      listViewDisplayed === true
    ) {
      return (
        <FlatList
          nativeID='result-list-id'
          scrollEnabled={!props.disableScroll}
          style={[props.suppressDefaultStyles ? {} : defaultStyles.listView, props.styles.listView]}
          data={dataSource}
          keyExtractor={keyGenerator}
          extraData={[dataSource, props]}
          ItemSeparatorComponent={_renderSeparator}
          renderItem={({ item, index }) => _renderRow(item, index)}
          ListEmptyComponent={stateText.length > props.minLength && props.listEmptyComponent}
          ListHeaderComponent={props.renderHeaderComponent && props.renderHeaderComponent(stateText)}
          ListFooterComponent={_renderPoweredLogo}
          {...props}
        />
      );
    }

    return null;
  }, [_renderPoweredLogo, _renderRow, _renderSeparator, dataSource, listViewDisplayed, props, stateText, supportedPlatform]);

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
    <View style={[props.suppressDefaultStyles ? {} : defaultStyles.container, props.styles.container]} pointerEvents='box-none'>
      {!props.textInputHide && (
        <View style={[props.suppressDefaultStyles ? {} : defaultStyles.textInputContainer, props.styles.textInputContainer]}>
          {_renderLeftButton()}
          <TextInputComp
            ref={inputRef}
            style={[props.suppressDefaultStyles ? {} : defaultStyles.textInput, props.styles.textInput]}
            value={stateText}
            placeholder={props.placeholder}
            onFocus={
              onFocus
                ? () => {
                    _onFocus();
                    onFocus();
                  }
                : _onFocus
            }
            onBlur={
              onBlur
                ? (e) => {
                    _onBlur(e);
                    onBlur();
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
  isRowScrollable: PropTypes.bool,
  keyboardShouldPersistTaps: PropTypes.oneOf(['never', 'always', 'handled']),
  listEmptyComponent: PropTypes.func,
  listUnderlayColor: PropTypes.string,
  // Must write it this way: https://stackoverflow.com/a/54290946/7180620
  listViewDisplayed: PropTypes.oneOfType([PropTypes.bool, PropTypes.oneOf(['auto'])]),
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
};

export default { GooglePlacesAutocomplete };
