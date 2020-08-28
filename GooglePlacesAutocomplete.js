import debounce from 'lodash.debounce';
import PropTypes from 'prop-types';
import Qs from 'qs';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  PixelRatio,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  View,
} from 'react-native';

const WINDOW = Dimensions.get('window');

const defaultStyles = {
  container: {
    flex: 1,
  },
  textInputContainer: {
    backgroundColor: '#C9C9CE',
    height: 44,
    borderTopColor: '#7e7e7e',
    borderBottomColor: '#b5b5b5',
    borderTopWidth: 1 / PixelRatio.get(),
    borderBottomWidth: 1 / PixelRatio.get(),
    flexDirection: 'row',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    height: 28,
    borderRadius: 5,
    paddingTop: 4.5,
    paddingBottom: 4.5,
    paddingLeft: 10,
    paddingRight: 10,
    marginTop: 7.5,
    marginLeft: 8,
    marginRight: 8,
    fontSize: 15,
    flex: 1,
  },
  poweredContainer: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  powered: {},
  listView: {},
  row: {
    padding: 13,
    height: 44,
    flexDirection: 'row',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#c8c7cc',
  },
  description: {},
  loader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    height: 20,
  },
};

export const GooglePlacesAutocomplete = forwardRef((props, ref) => {
  let _results = [];
  let _requests = [];

  const buildRowsFromResults = (results) => {
    let res = [];

    if (results.length === 0 || props.predefinedPlacesAlwaysVisible === true) {
      res = [
        ...props.predefinedPlaces.filter((place) => place?.description.length),
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
  };

  const getRequestUrl = (requestUrl) => {
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
  };

  const [stateText, setStateText] = useState('');
  const [dataSource, setDataSource] = useState(buildRowsFromResults([]));
  const [listViewDisplayed, setListViewDisplayed] = useState(
    props.listViewDisplayed === 'auto' ? false : props.listViewDisplayed,
  );
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

  useImperativeHandle(ref, () => ({
    setAddressText: (address) => {
      setStateText(address);
    },
    getAddressText: () => stateText,
    ...inputRef.current,
  }));

  const requestShouldUseWithCredentials = () =>
    url === 'https://maps.googleapis.com/maps/api';

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

  const _abortRequests = () => {
    _requests.map((i) => i.abort());
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

    navigator.geolocation.getCurrentPosition(
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

      request.withCredentials = requestShouldUseWithCredentials();

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
          return;
        }

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

      request.send();
    } else {
      _results = [];
      setDataSource(buildRowsFromResults([]));
    }
  };

  const _request = (text) => {
    _abortRequests();
    if (supportedPlatform() && text && text.length >= props.minLength) {
      const request = new XMLHttpRequest();
      _requests.push(request);
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
                ? _filterResultsByTypes(
                    responseJSON.predictions,
                    props.filterReverseGeocodingByTypes,
                  )
                : responseJSON.predictions;

            _results = results;
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
      request.open(
        'GET',
        `${url}/place/autocomplete/json?&input=` +
          encodeURIComponent(text) +
          '&' +
          Qs.stringify(props.query),
      );

      request.withCredentials = requestShouldUseWithCredentials();

      request.send();
    } else {
      _results = [];
      setDataSource(buildRowsFromResults([]));
    }
  };

  // const clearText = () => setStateText('');

  const debounceData = useCallback(debounce(_request, props.debounce), []);

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

  const _renderRowData = (rowData) => {
    if (props.renderRow) {
      return props.renderRow(rowData);
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

  const _renderRow = (rowData = {}) => {
    return (
      <ScrollView
        // eslint-disable-next-line react-native/no-inline-styles
        style={{ flex: 1 }}
        scrollEnabled={props.isRowScrollable}
        keyboardShouldPersistTaps={props.keyboardShouldPersistTaps}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        <TouchableHighlight
          style={{ width: WINDOW.width }}
          onPress={() => _onPress(rowData)}
          underlayColor={props.listUnderlayColor || '#c8c7cc'}
        >
          <View
            style={[
              props.suppressDefaultStyles ? {} : defaultStyles.row,
              props.styles.row,
              rowData.isPredefinedPlace ? props.styles.specialItemRow : {},
            ]}
          >
            {_renderLoader(rowData)}
            {_renderRowData(rowData)}
          </View>
        </TouchableHighlight>
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

  const _onBlur = () => {
    setListViewDisplayed(false);
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
          scrollEnabled={!props.disableScroll}
          style={[
            props.suppressDefaultStyles ? {} : defaultStyles.listView,
            props.styles.listView,
          ]}
          data={dataSource}
          keyExtractor={keyGenerator}
          extraData={[dataSource, props]}
          ItemSeparatorComponent={_renderSeparator}
          renderItem={({ item }) => _renderRow(item)}
          ListEmptyComponent={
            stateText.length > props.minLength && props.listEmptyComponent
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
    clearButtonMode,
    InputComp,
    ...userProps
  } = props.textInputProps;
  const TextInputComp = InputComp ? InputComp : TextInput;
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
            editable={props.editable}
            returnKeyType={props.returnKeyType}
            keyboardAppearance={props.keyboardAppearance}
            autoFocus={props.autoFocus}
            style={[
              props.suppressDefaultStyles ? {} : defaultStyles.textInput,
              props.styles.textInput,
            ]}
            value={stateText}
            placeholder={props.placeholder}
            onSubmitEditing={props.onSubmitEditing}
            placeholderTextColor={props.placeholderTextColor}
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
                ? () => {
                    _onBlur();
                    onBlur();
                  }
                : _onBlur
            }
            underlineColorAndroid={props.underlineColorAndroid}
            clearButtonMode={
              clearButtonMode ? clearButtonMode : 'while-editing'
            }
            {...userProps}
            onChangeText={_handleChangeText}
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
  autoFocus: PropTypes.bool,
  currentLocation: PropTypes.bool,
  currentLocationLabel: PropTypes.string,
  debounce: PropTypes.number,
  enableHighAccuracyLocation: PropTypes.bool,
  enablePoweredByContainer: PropTypes.bool,
  fetchDetails: PropTypes.bool,
  filterReverseGeocodingByTypes: PropTypes.array,
  GooglePlacesDetailsQuery: PropTypes.object,
  GooglePlacesSearchQuery: PropTypes.object,
  GoogleReverseGeocodingQuery: PropTypes.object,
  isRowScrollable: PropTypes.bool,
  keyboardAppearance: PropTypes.oneOf(['default', 'light', 'dark']),
  listEmptyComponent: PropTypes.func,
  listUnderlayColor: PropTypes.string,
  minLength: PropTypes.number,
  nearbyPlacesAPI: PropTypes.string,
  numberOfLines: PropTypes.number,
  onFail: PropTypes.func,
  onNotFound: PropTypes.func,
  onPress: PropTypes.func,
  onSubmitEditing: PropTypes.func,
  onTimeout: PropTypes.func,
  placeholder: PropTypes.string,
  predefinedPlaces: PropTypes.array,
  predefinedPlacesAlwaysVisible: PropTypes.bool,
  query: PropTypes.object,
  renderDescription: PropTypes.func,
  renderLeftButton: PropTypes.func,
  renderRightButton: PropTypes.func,
  renderRow: PropTypes.func,
  requestUrl: PropTypes.shape({
    url: PropTypes.string,
    useOnPlatform: PropTypes.oneOf(['web', 'all']),
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
  keyboardAppearance: 'default',
  keyboardShouldPersistTaps: 'always',
  listViewDisplayed: 'auto',
  minLength: 0,
  nearbyPlacesAPI: 'GooglePlacesSearch',
  numberOfLines: 1,
  onFail: () => {},
  onNotFound: () => {},
  onSubmitEditing: () => {},
  onPress: () => {},
  onTimeout: () => console.warn('google places autocomplete: request timeout'),
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
