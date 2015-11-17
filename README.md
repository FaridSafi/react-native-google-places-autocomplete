# react-native-google-places-autocomplete
Customizable Google Places autocomplete component for iOS and Android React-Native apps


### Changelog
- 1.1.1 : New method ```triggerFocus()``` to focus on text input manually - PR @halilb
- 1.1.0 : The component is now using props
- 1.0.14 : Support of the new react-native asset system. This version is not compatible anymore with RN versions older than 0.14.0
- 1.0.13 : RN 0.13.2 compatibility improvements

### Example

![](https://raw.githubusercontent.com/FaridSafi/react-native-google-places-autocomplete/master/Assets/screenshot.png)

```js
var {GooglePlacesAutocomplete} = require('react-native-google-places-autocomplete');

var Example = React.createClass({
  render() {
    return (
      <GooglePlacesAutocomplete
        placeholder='Search'
        minLength={2} // minimum length of text to search
        autoFocus={true}
        fetchDetails={true}
        onPress={(data, details = null) => { // details is provided when fetchDetails = true
          console.log(data);
          console.log(details);
        }}
        getDefaultValue={() => {
          return ''; // text input default value
        }}
        query={{
          // available options: https://developers.google.com/places/web-service/autocomplete
          key: 'YOUR API KEY',
          language: 'en', // language of the results
          types: '(cities)', // default: 'geocode'
        }}
        styles={{
          description: {
            fontWeight: 'bold',
          }
        }}
      />
    );
  }
});
```


### Installation

1. ```npm install react-native-google-places-autocomplete --save```
2. Get your [Google Places API keys](https://developers.google.com/places/) and enable "Google Places API Web Service" (NOT Android or iOS) in the console.


### Features

- [x] Places autocompletion
- [x] iOS and Android compatibility
- [x] Places details fetching + ActivityIndicatorIOS/ProgressBarAndroid loaders
- [x] Customizable using the ```styles``` parameter
- [x] XHR cancellations when typing fast
- [x] Google Places terms compliant
- [ ] Caching of results

### License

[MIT](LICENSE)

Feel free to ask me questions on Twitter [@FaridSafi](https://www.twitter.com/FaridSafi) !

