# react-native-google-places-autocomplete
Customizable Google Places autocomplete component for iOS and Android React-Native apps

### Install

* ```npm install react-native-google-places-autocomplete --save```
* Get your iOS/Android [Google Places API keys](https://developers.google.com/places/)
* Add the "Powered by Google" [image assets](https://developers.google.com/places/documentation/images/powered-by-google.zip) to your iOS/Android projects




### Example

```js
var GooglePlacesAutocomplete = require('react-native-google-places-autocomplete').create({
  placeholder: 'Search',
  minLength: 2, // minimum length of text to search
  onPress(data) {
    console.log(data);
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


### License

[MIT](LICENSE.md)

Feel free to ask me questions on Twitter [@FaridSafi](https://www.twitter.com/FaridSafi) !

