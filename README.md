# react-native-google-places-autocomplete

Customizable Google Places autocomplete component for iOS and Android React-Native apps

## Preview

![](https://raw.githubusercontent.com/FaridSafi/react-native-google-places-autocomplete/master/Assets/screenshot.png)

## Installation

1. `npm install react-native-google-places-autocomplete --save`
2. Get your [Google Places API keys](https://developers.google.com/places/documentation/) and enable "Google Places API Web Service" (NOT Android or iOS) in the console.
3. Enable "Google Maps Geocoding API" if you want to use GoogleReverseGeocoding for Current Location

## Basic Example

**Basic Address Search**

```jsx
import React from 'react';
import { Image, Text } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const GooglePlacesInput = () => {
  return (
    <GooglePlacesAutocomplete
      placeholder='Search'
      onPress={(data, details = null) => {
        // 'details' is provided when fetchDetails = true
        console.log(data, details);
      }}
      query={{
        key: 'YOUR API KEY',
        language: 'en',
      }}
    />
  );
};

export default GooglePlacesInput;
```

You can also try the basic example in a snack [here](https://snack.expo.io/@sbell/react-native-google-places-autocomplete)

## More Examples

**Get Current Location**

<details>
  <summary>Click to expand</summary>

_Extra step required!_

If you are targeting React Native 0.60.0+ you must install either `@react-native-community/geolocation` ([link](https://github.com/react-native-community/react-native-geolocation)) or `react-native-geolocation-service`([link](https://github.com/Agontuk/react-native-geolocation-service)).

Please make sure you follow the installation instructions there and add `navigator.geolocation = require(GEOLOCATION_PACKAGE)` somewhere in you application before `<GooglePlacesAutocomplete />`.

```jsx
import React from 'react';
import { Image, Text } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

// navigator.geolocation = require('@react-native-community/geolocation');
// navigator.geolocation = require('react-native-geolocation-service');

const GooglePlacesInput = () => {
  return (
    <GooglePlacesAutocomplete
      placeholder='Search'
      onPress={(data, details = null) => {
        // 'details' is provided when fetchDetails = true
        console.log(data, details);
      }}
      query={{
        key: 'YOUR API KEY',
        language: 'en',
      }}
      currentLocation={true}
      currentLocationLabel='Current location'
    />
  );
};

export default GooglePlacesInput;
```

</details>

**Search with predefined option**

<details>
  <summary>Click to expand</summary>

```jsx
import React from 'react';
import { Image, Text } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const homePlace = {
  description: 'Home',
  geometry: { location: { lat: 48.8152937, lng: 2.4597668 } },
};
const workPlace = {
  description: 'Work',
  geometry: { location: { lat: 48.8496818, lng: 2.2940881 } },
};

const GooglePlacesInput = () => {
  return (
    <GooglePlacesAutocomplete
      placeholder='Search'
      onPress={(data, details = null) => {
        // 'details' is provided when fetchDetails = true
        console.log(data, details);
      }}
      query={{
        key: 'YOUR API KEY',
        language: 'en',
      }}
      predefinedPlaces={[homePlace, workPlace]}
    />
  );
};

export default GooglePlacesInput;
```

</details>

**Limit results to one country**

<details>
  <summary>Click to expand</summary>

```jsx
import React from 'react';
import { Image, Text } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const GooglePlacesInput = () => {
  return (
    <GooglePlacesAutocomplete
      placeholder='Search'
      onPress={(data, details = null) => {
        // 'details' is provided when fetchDetails = true
        console.log(data, details);
      }}
      query={{
        key: 'YOUR API KEY',
        language: 'en',
        components: 'country:us',
      }}
    />
  );
};

export default GooglePlacesInput;
```

</details>

## Styling

`GooglePlacesAutocomplete` can be easily customized to meet styles of your app. Pass styles props to `GooglePlacesAutocomplete` with style object for different elements (keys for style object are listed below)

| key                         | type                    |
| --------------------------- | ----------------------- |
| container                   | object (View)           |
| description                 | object (Text style)     |
| textInputContainer          | object (View style)     |
| textInput                   | object (style)          |
| loader                      | object (View style)     |
| listView                    | object (ListView style) |
| predefinedPlacesDescription | object (Text style)     |
| poweredContainer            | object (View style)     |
| powered                     | object (Image style)    |
| separator                   | object (View style)     |
| row                         | object (View style)     |

### Example

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
      borderBottomWidth: 0,
    },
    textInput: {
      marginLeft: 0,
      marginRight: 0,
      height: 38,
      color: '#5d5d5d',
      fontSize: 16,
    },
    predefinedPlacesDescription: {
      color: '#1faadb',
    },
  }}
/>
```

## Web Support

Web support can be enabled via the `requestUrl` prop, by passing in a URL that you can use to proxy your requests. CORS implemented by the Google Places API prevent using this library directly on the web. You can use a proxy server like [CORS Anywhere](https://github.com/Rob--W/cors-anywhere/) or roll your own. Please be mindful of this limitation when opening an issue.

**_Note:_** The library expects the same response that the Google Maps API would return.

## Features

- [x] Places autocompletion
- [x] iOS and Android compatibility
- [x] Places details fetching + ActivityIndicatorIOS/ProgressBarAndroid loaders
- [x] Customizable using the `styles` parameter
- [x] XHR cancellations when typing fast
- [x] Google Places terms compliant
- [x] Predefined places
- [x] typescript types
- [x] Current location

### Changelog

- 1.4.2+: Please see the [releases](https://github.com/FaridSafi/react-native-google-places-autocomplete/releases) tab for the changelog information.
- 1.3.9 : Multiple bugfixes + fixed breaking change in React Native.
- 1.3.6 : Fixed accuracy issue.
- 1.3.5 : Fixed bug where input was being cleared.
- 1.3.4 : Fixed bug where loading was breaking the component.
- 1.3.3 : Fixed `key prop` warning and added loading indicator.
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
