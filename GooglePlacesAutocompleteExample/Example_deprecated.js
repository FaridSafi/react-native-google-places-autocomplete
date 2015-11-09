/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 */
'use strict';

var React = require('react-native');
var {
  AppRegistry,
  StyleSheet,
  Text,
  View,
} = React;


var GooglePlacesAutocomplete = require('react-native-google-places-autocomplete').create({
  placeholder: 'Search',
  minLength: 2, // minimum length of text to search
  autoFocus: true,
  fetchDetails: true,
  onPress(data, details = null) { // details is provided when fetchDetails = true
    console.log(data);
    console.log(details);
  },
  getDefaultValue() {
    return ''; // text input default value
  },
  query: {
    // available options: https://developers.google.com/places/web-service/autocomplete
    key: 'YOUR API KEY',
    language: 'en', // language of the results
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
    return (
      <GooglePlacesAutocomplete />
    );
  }
});


module.exports = Example;




