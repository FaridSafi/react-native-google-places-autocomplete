const React = require('react-native');
const {TextInput, View, ListView, Image, Text, Dimensions, TouchableHighlight, TouchableWithoutFeedback, Platform, ActivityIndicatorIOS, ProgressBarAndroid} = React;
const Qs = require('qs');

const defaultStyles = {
  container: {
  },
  textInputContainer: {
    backgroundColor: '#C9C9CE',
    height: 44,
    borderTopColor: '#7e7e7e',
    borderBottomColor: '#b5b5b5',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
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
  },
  poweredContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  powered: {
    marginTop: 15,
  },
  listView: {
    height: Dimensions.get('window').height - 44,
  },
  row: {
    padding: 13,
    height: 44,
    flexDirection: 'row',
  },
  separator: {
    height: 1,
    backgroundColor: '#c8c7cc',
  },
  description: {
  },
  loader: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    height: 20,
  },
  androidLoader: {
    marginRight: -15,
  },
};

const GooglePlacesAutocomplete = React.createClass({

  propTypes: {
    placeholder: React.PropTypes.string,
    onPress: React.PropTypes.func,
    minLength: React.PropTypes.number,
    fetchDetails: React.PropTypes.bool,
    autoFocus: React.PropTypes.bool,
    getDefaultValue: React.PropTypes.func,
    timeout: React.PropTypes.number,
    onTimeout: React.PropTypes.func,
    query: React.PropTypes.object,
    styles: React.PropTypes.object,
    textInputProps: React.PropTypes.object,
    enablePoweredByContainer: React.PropTypes.bool,
    specialItems: React.PropTypes.array,
  },

  getDefaultProps() {
    return {
      placeholder: 'Search',
      onPress: () => {},
      minLength: 0,
      fetchDetails: false,
      autoFocus: false,
      getDefaultValue: () => '',
      timeout: 20000,
      onTimeout: () => console.warn('google places autocomplete: request timeout'),
      query: {
        key: 'missing api key',
        language: 'en',
        types: 'geocode',
      },
      styles: {
      },
      textInputProps: {},
      enablePoweredByContainer: true,
      specialItems: [],
    };
  },

  getInitialState() {
    const ds = new ListView.DataSource({rowHasChanged: function rowHasChanged(r1, r2) {
      if (typeof r1.isLoading !== 'undefined') {
        return true;
      }
      return r1 !== r2;
    }});
    return {
      text: this.props.getDefaultValue(),
      dataSource: ds.cloneWithRows(this.buildRowsFromResults([])),
      listViewDisplayed: false,
    };
  },

  buildRowsFromResults(results) {
    return [...this.props.specialItems, ...results];
  },

  componentWillUnmount() {
    this._abortRequests();
  },

  _abortRequests() {
    for (let i = 0; i < this._requests.length; i++) {
      this._requests[i].abort();
    }
    this._requests = [];
  },

  /**
   * This method is exposed to parent components to focus on textInput manually.
   * @public
   */
  triggerFocus() {
    if (this.refs.textInput) this.refs.textInput.focus();
  },

  /**   
   * This method is exposed to parent components to blur textInput manually.   
   * @public   
   */    
  triggerBlur() {    
    if (this.refs.textInput) this.refs.textInput.blur();   
  },   

  _enableRowLoader(rowData) {
    for (let i = 0; i < this._results.length; i++) {
      if (this._results[i].place_id === rowData.place_id) {
        this._results[i].isLoading = true;
        this.setState({
          dataSource: this.state.dataSource.cloneWithRows(this.buildRowsFromResults(this._results)),
        });
        break;
      }
    }
  },
  _disableRowLoaders() {
    if (this.isMounted()) {
      for (let i = 0; i < this._results.length; i++) {
        if (this._results[i].isLoading === true) {
          this._results[i].isLoading = false;
        }
      }
      this.setState({
        dataSource: this.state.dataSource.cloneWithRows(this.buildRowsFromResults(this._results)),
      });
    }
  },
  _onPress(rowData) {
    if (this.props.specialItems.indexOf(rowData) === -1 && this.props.fetchDetails === true) {
      if (rowData.isLoading === true) {
        // already requesting
        return;
      }

      this._abortRequests();

      // display loader
      this._enableRowLoader(rowData);

      // fetch details
      const request = new XMLHttpRequest();
      this._requests.push(request);
      request.timeout = this.props.timeout;
      request.ontimeout = this.props.onTimeout;
      request.onreadystatechange = () => {
        if (request.readyState !== 4) {
          return;
        }
        if (request.status === 200) {
          const responseJSON = JSON.parse(request.responseText);
          if (responseJSON.status === 'OK') {
            if (this.isMounted()) {
              const details = responseJSON.result;
              this._disableRowLoaders();
              if (typeof this.refs.textInput.blur === 'function') {
                this.refs.textInput.blur();
              }

              this.setState({
                text: rowData.description,
                listViewDisplayed: false,
              });

              delete rowData.isLoading;
              this.props.onPress(rowData, details);
            }
          } else {
            this._disableRowLoaders();
            console.warn('google places autocomplete: ' + responseJSON.status);
          }
        } else {
          this._disableRowLoaders();
          console.warn('google places autocomplete: request could not be completed or has been aborted');
        }
      };
      request.open('GET', 'https://maps.googleapis.com/maps/api/place/details/json?' + Qs.stringify({
        key: this.props.query.key,
        placeid: rowData.place_id,
        language: this.props.query.language,
      }));
      request.send();
    } else {
      this.setState({
        text: rowData.description,
        listViewDisplayed: false,
      });

      if (typeof this.refs.textInput.blur === 'function') {
        this.refs.textInput.blur();
      }
      delete rowData.isLoading;
      this.props.onPress(rowData);
    }
  },
  _results: [],
  _requests: [],
  _request(text) {
    this._abortRequests();
    if (text.length >= this.props.minLength) {
      const request = new XMLHttpRequest();
      this._requests.push(request);
      request.timeout = this.props.timeout;
      request.ontimeout = this.props.onTimeout;
      request.onreadystatechange = () => {
        if (request.readyState !== 4) {
          return;
        }
        if (request.status === 200) {
          const responseJSON = JSON.parse(request.responseText);
          if (typeof responseJSON.predictions !== 'undefined') {
            if (this.isMounted()) {
              this._results = responseJSON.predictions;
              this.setState({
                dataSource: this.state.dataSource.cloneWithRows(this.buildRowsFromResults(responseJSON.predictions)),
              });
            }
          }
          if (typeof responseJSON.error_message !== 'undefined') {
            console.warn('google places autocomplete: ' + responseJSON.error_message);
          }
        } else {
          // console.warn("google places autocomplete: request could not be completed or has been aborted");
        }
      };
      request.open('GET', 'https://maps.googleapis.com/maps/api/place/autocomplete/json?&input=' + encodeURI(text) + '&' + Qs.stringify(this.props.query));
      request.send();
    } else {
      this._results = [];
      this.setState({
        dataSource: this.state.dataSource.cloneWithRows(this.buildRowsFromResults([])),
      });
    }
  },
  _onChangeText(text) {
    this._request(text);
    this.setState({
      text: text,
      listViewDisplayed: true,
    });
  },
  _getRowLoader() {
    if (Platform.OS === 'android') {
      return (
        <ProgressBarAndroid
          style={[defaultStyles.androidLoader, this.props.styles.androidLoader]}
          styleAttr="Inverse"
        />
      );
    }

    return (
      <ActivityIndicatorIOS
        animating={true}
        size="small"
      />
    );
  },

  _renderRow(rowData = {}) {
    rowData.description = rowData.description || 'Unknown';
    var isSpecialItem = this.props.specialItems.indexOf(rowData) !== -1;
    return (
      <TouchableHighlight
        onPress={() =>
          this._onPress(rowData)
        }
        underlayColor="#c8c7cc"
      >
        <View>
          <View style={[defaultStyles.row, this.props.styles.row, isSpecialItem ? this.props.styles.specialItemRow : {}]}>
            <Text
              style={[defaultStyles.description, this.props.styles.description, isSpecialItem ? this.props.styles.specialItemDescription : {}]}
              numberOfLines={1}
            >{rowData.description}</Text>
            <View
              style={[defaultStyles.loader, this.props.styles.loader]}
            >
              {rowData.isLoading === true ? this._getRowLoader() : null}
            </View>
          </View>
          <View style={[defaultStyles.separator, this.props.styles.separator]} />
        </View>
      </TouchableHighlight>
    );
  },

   _onBlur() {
     this.setState({listViewDisplayed: false});
   },

  _onFocus() {
    this.setState({listViewDisplayed: true});
  },

  _getListView() {
    if ((this.state.text !== '' || this.props.specialItems.length) && this.state.listViewDisplayed === true) {
      return (
        <View style={defaultStyles.listView}>
          <ListView
            keyboardShouldPersistTaps={true}
            keyboardDismissMode="on-drag"
            style={[this.props.styles.listView, {flex: 0}]}
            dataSource={this.state.dataSource}
            renderRow={this._renderRow}
            automaticallyAdjustContentInsets={false}

            {...this.props}
          />
          <TouchableWithoutFeedback onPress={() => { this.refs.textInput.blur(); this.props.onPress(null);} }>
            <View style={{flex: 1, backgroundColor: 'transparent'}}></View>
          </TouchableWithoutFeedback>
        </View>
      );
    }

    if(this.props.enablePoweredByContainer) {
      return (
        <View
          style={[defaultStyles.poweredContainer, this.props.styles.poweredContainer]}
        >
          <Image
            style={[defaultStyles.powered, this.props.styles.powered]}
            resizeMode={Image.resizeMode.contain}
            source={require('./images/powered_by_google_on_white.png')}
          />
        </View>
      );
    }

    return null;
  },
  render() {
    let { onChangeText, onFocus, ...userProps } = this.props.textInputProps;
    return (
      <View
        style={[defaultStyles.container, this.props.styles.container]}
      >
        <View
          style={[defaultStyles.textInputContainer, this.props.styles.textInputContainer]}
        >
          <TextInput
            { ...userProps }
            ref="textInput"
            autoFocus={this.props.autoFocus}
            style={[defaultStyles.textInput, this.props.styles.textInput]}
            onChangeText={onChangeText ? text => {this._onChangeText(text); onChangeText(text)} : this._onChangeText}
            value={this.state.text}
            placeholder={this.props.placeholder}
            onBlur={this._onBlur}
            onFocus={onFocus ? () => {this._onFocus(); onFocus()} : this._onFocus}
            clearButtonMode="while-editing"
          />
        </View>
        {this._getListView()}
      </View>
    );
  },
});


// this function is still present in the library to be retrocompatible with version < 1.1.0
const create = function create(options = {}) {
  return React.createClass({
    render() {
      return (
        <GooglePlacesAutocomplete ref="GooglePlacesAutocomplete"
          {...options}
        />
      );
    },
  });
};


module.exports = {GooglePlacesAutocomplete, create};
