/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 */
'use strict';

var React = require('react-native');
var {
  AppRegistry,
  StyleSheet,
  View,
  Dimensions,
} = React;

var positionFromTop = 64;
var styles = StyleSheet.create({
  container: {
    top: positionFromTop
  },
});

var GooglePlacesAutocomplete = require('react-native-google-places-autocomplete').create({
  placeholder: 'Search',
  minLength: 2, // minimum length of text to search
  fetchDetails: true,
  timeout: 20000,
  ontimeout() {
    console.log('please check your internet connection');
  },
  onPress(data, details = null) { // details is provided when fetchDetails = true
    console.log(data);
    console.log(details);
  },
  query: {
    // available options: https://developers.google.com/places/web-service/autocomplete
    key: 'YOUR API KEY',
    language: 'en', // default: 'en' - language of the results
    types: '(cities)', // default: 'geocode'
  },
  styles: {
    description: {
      fontWeight: 'bold',
    },
    listView: {
      height: Dimensions.get('window').height - 44 - positionFromTop, // default: height of screen - 44 (search bar height)
    },
    powered: {
      width: 120,
      marginTop: 10,
    },
    
  }
});



var Example = React.createClass({
  render: function() {
    /* jshint ignore:start */
    return (
      <View style={styles.container} >
        <GooglePlacesAutocomplete />
      </View>
    );
    /* jshint ignore:end */
  }
});

AppRegistry.registerComponent('Example', () => Example);