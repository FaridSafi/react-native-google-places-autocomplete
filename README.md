# react-native-google-places-autocomplete
Customizable Google Places autocomplete component for iOS and Android React-Native apps


### Example

![](https://raw.githubusercontent.com/FaridSafi/react-native-google-places-autocomplete/master/Assets/screenshot.png)

```js
var GooglePlacesAutocomplete = require('react-native-google-places-autocomplete').create({
  placeholder: 'Search',
  minLength: 2, // minimum length of text to search
  fetchDetails: true,
  onPress(data, details = null) { // details is provided when fetchDetails = true
    console.log(data);
    console.log(details);
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
```


### Install

1. ```npm install react-native-google-places-autocomplete --save```
2. Get your [Google Places API keys](https://developers.google.com/places/) and enable "Google Places API Web Service" (NOT Android or iOS) in the console.
3. Add the "Powered by Google" [image assets](https://developers.google.com/places/documentation/images/powered-by-google.zip) to your iOS/Android projects


### License

[MIT](LICENSE.md)

Feel free to ask me questions on Twitter [@FaridSafi](https://www.twitter.com/FaridSafi) !

