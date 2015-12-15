# react-native-google-places-autocomplete
Customizable Google Places autocomplete component for iOS and Android React-Native apps

### Changelog
- 1.1.6 : currentLocationAPI renamed to nearbyPlacesAPI, added predefinedPlacesAlwaysVisible prop
- 1.1.4 : Added 'Current Location' and predefinied places features - PRs @kevinstumpf @VonD
- 1.1.3 : Keyboard is now dismissed by default when scrolling to be more usable with small height devices (eg: iPhone 4) + Props are now passed to the results ListView


### Example

![](https://raw.githubusercontent.com/FaridSafi/react-native-google-places-autocomplete/master/Assets/screenshot.png)

```js
var {GooglePlacesAutocomplete} = require('react-native-google-places-autocomplete');

const homePlace = {description: 'Home', geometry: { location: { lat: 48.8152937, lng: 2.4597668 } }};
const workPlace = {description: 'Work', geometry: { location: { lat: 48.8496818, lng: 2.2940881 } }};

var Example = React.createClass({
  render() {
    return (
      <GooglePlacesAutocomplete
        placeholder='Search'
        minLength={2} // minimum length of text to search
        autoFocus={false}
        fetchDetails={true}
        onPress={(data, details = null) => { // 'details' is provided when fetchDetails = true
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
          },
          predefinedPlacesDescription: {
            color: '#1faadb',
          },
        }}
        
        currentLocation={true} // Will add a 'Current location' button at the top of the predefined places list
        currentLocationLabel="Current location"
        currentLocationAPI='GooglePlacesSearch' // Which API to use: GoogleReverseGeocoding or GooglePlacesSearch
        GoogleReverseGeocodingQuery={{
          // available options for GoogleReverseGeocoding API : https://developers.google.com/maps/documentation/geocoding/intro
        }}
        GooglePlacesSearchQuery={{
          // available options for GooglePlacesSearch API : https://developers.google.com/places/web-service/search
          rankby: 'distance',
          types: 'food',
        }}
        
        
        filterReverseGeocodingByTypes={['locality', 'administrative_area_level_3']} // filter the reverse geocoding results by types - ['locality', 'administrative_area_level_3'] if you want to display only cities
        
        predefinedPlaces={[homePlace, workPlace]}
      />
    );
  }
});
```


### Installation

1. ```npm install react-native-google-places-autocomplete --save```
2. Get your [Google Places API keys](https://developers.google.com/places/) and enable "Google Places API Web Service" (NOT Android or iOS) in the console.
3. Enable "Google Maps Geocoding API" if you want to use GoogleReverseGeocoding for Current Location


### Features

- [x] Places autocompletion
- [x] iOS and Android compatibility
- [x] Places details fetching + ActivityIndicatorIOS/ProgressBarAndroid loaders
- [x] Customizable using the ```styles``` parameter
- [x] XHR cancellations when typing fast
- [x] Google Places terms compliant
- [x] Current location
- [x] Predefined places


### License

[MIT](LICENSE)

Feel free to ask me questions on Twitter [@FaridSafi](https://www.twitter.com/FaridSafi) !

