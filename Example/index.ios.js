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
} = React;

var positionFromTop = 64;
var styles = StyleSheet.create({
  container: {
    top: positionFromTop
  },
});

var GooglePlacesAutocomplete = require('react-native-google-places-autocomplete').create({
  placeholder: 'Search',
  positionFromTop: positionFromTop, // position from the top of the screen
  minLength: 2, // minimum length of text to search
  onPress(data) {
    console.log(data);
  },
  query: {
    // available options: https://developers.google.com/places/web-service/autocomplete
    key: 'YOUR API KEY',
    language: 'en', // default: 'en' language of the results
    types: '(cities)', // default: 'geocode'
  },
  styles: {
    description: {
      fontWeight: 'bold',
    }
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