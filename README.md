# react-native-google-places-autocomplete
Customizable Google Places autocomplete component for iOS and Android React-Native apps

### Preview

![](https://raw.githubusercontent.com/FaridSafi/react-native-google-places-autocomplete/master/Assets/screenshot.png)

### Installation

1. ```npm install react-native-google-places-autocomplete --save```
2. Get your [Google Places API keys](https://developers.google.com/places/documentation/) and enable "Google Places API Web Service" (NOT Android or iOS) in the console.
3. Enable "Google Maps Geocoding API" if you want to use GoogleReverseGeocoding for Current Location

### Example

```jsx
import React from 'react';
import { View, Image } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const homePlace = { description: 'Home', geometry: { location: { lat: 48.8152937, lng: 2.4597668 } }};
const workPlace = { description: 'Work', geometry: { location: { lat: 48.8496818, lng: 2.2940881 } }};

const GooglePlacesInput = () => {
  return (
    <GooglePlacesAutocomplete
      placeholder='Search'
      minLength={2} // minimum length of text to search
      autoFocus={false}
      returnKeyType={'search'} // Can be left out for default return key https://facebook.github.io/react-native/docs/textinput.html#returnkeytype
      listViewDisplayed='auto'    // true/false/undefined
      fetchDetails={true}
      renderDescription={row => row.description} // custom description render
      onPress={(data, details = null) => { // 'details' is provided when fetchDetails = true
        console.log(data, details);
      }}
      
      getDefaultValue={() => ''}
      
      query={{
        // available options: https://developers.google.com/places/web-service/autocomplete
        key: 'YOUR API KEY',
        language: 'en', // language of the results
        types: '(cities)' // default: 'geocode'
      }}
      
      styles={{
        textInputContainer: {
          width: '100%'
        },
        description: {
          fontWeight: 'bold'
        },
        predefinedPlacesDescription: {
          color: '#1faadb'
        }
      }}
      
      currentLocation={true} // Will add a 'Current location' button at the top of the predefined places list
      currentLocationLabel="Current location"
      nearbyPlacesAPI='GooglePlacesSearch' // Which API to use: GoogleReverseGeocoding or GooglePlacesSearch
      GoogleReverseGeocodingQuery={{
        // available options for GoogleReverseGeocoding API : https://developers.google.com/maps/documentation/geocoding/intro
      }}
      GooglePlacesSearchQuery={{
        // available options for GooglePlacesSearch API : https://developers.google.com/places/web-service/search
        rankby: 'distance',
        types: 'food'
      }}

      filterReverseGeocodingByTypes={['locality', 'administrative_area_level_3']} // filter the reverse geocoding results by types - ['locality', 'administrative_area_level_3'] if you want to display only cities
      predefinedPlaces={[homePlace, workPlace]}

      debounce={200} // debounce the requests in ms. Set to 0 to remove debounce. By default 0ms.
      renderLeftButton={()  => <Image source={require('path/custom/left-icon')} />}
      renderRightButton={() => <Text>Custom text after the input</Text>}
    />
  );
}
```


### Styling

```GooglePlacesAutocomplete``` can be easily customized to meet styles of your  app. Pass styles props to ```GooglePlacesAutocomplete``` with style object for different elements (keys for style object are listed below)

| key | type |
| ---- | ---- |
| container | object (View) |
| description | object (Text style) |
| textInputContainer | object (View style) |
| textInput | object (style) |
| loader | object (View style) |
| listView | object (ListView style) |
| predefinedPlacesDescription | object (Text style) |
| poweredContainer | object (View style) |
| powered | object (Image style) |
| separator | object (View style) |


#### Example


```jsx
<GooglePlacesAutocomplete
  placeholder='Enter Location'
  minLength={2}
  autoFocus={false}
  returnKeyType={'default'}
  fetchDetails={true}
  styles={{
    textInputContainer: {
      backgroundColor: 'rgba(0,0,0,0)',
      borderTopWidth: 0,
      borderBottomWidth:0
    },
    textInput: {
      marginLeft: 0,
      marginRight: 0,
      height: 38,
      color: '#5d5d5d',
      fontSize: 16
    },
    predefinedPlacesDescription: {
      color: '#1faadb'
    },
  }}
  currentLocation={false}
/>
```


### Features

- [x] Places autocompletion
- [x] iOS and Android compatibility
- [x] Places details fetching + ActivityIndicatorIOS/ProgressBarAndroid loaders
- [x] Customizable using the ```styles``` parameter
- [x] XHR cancellations when typing fast
- [x] Google Places terms compliant
- [x] Current location
- [x] Predefined places

### Changelog
- 1.3.9 : Multiple bugfixes + fixed breaking change in React Native.
- 1.3.6 : Fixed accuracy issue.
- 1.3.5 : Fixed bug where input was being cleared.
- 1.3.4 : Fixed bug where loading was breaking the component.
- 1.3.3 : Fixed `key prop` warning  and added loading indicator.
- 1.3.2 : Added small feature which makes the request on `componentDidMount()` when you
  already have the default value set.
- 1.3.1 : Update `react-native` peerDependecy. (> 0.46)
- 1.3.0 : Added support for React 16 (isMounted() and propTypes bugfix), support for restricted API key and moving from `ListView` to `Flatlist`.
- 1.2.12 : Fixed render description + docs.
- 1.2.11 : Fixed current location result `onPress` event.
- 1.2.10 : Set default `debounce` to `0`. Fixed debounce typing lag.
- 1.2.9 : Added `isRowScrollable` prop.
- 1.2.8 : Added `underlineColorAndroid`, `listUnderlayColor`, `renderLeftButton`, `renderRightButton` props. Added `nearbyPlacesAPI` option `None`.


### License

[MIT](LICENSE)

### Authors

- [Farid Safi](https://www.twitter.com/FaridSafi)
- [Maxim Yaskevich](https://www.twitter.com/mayaskme)
- [Guilherme Pontes](https://www.twitter.com/guiiipontes)
