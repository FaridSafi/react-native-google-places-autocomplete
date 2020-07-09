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

```js
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

```js
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

```js
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

```js
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

## Props

_This list is a work in progress. PRs welcome!_

| Prop Name                     | type     | description                                                                                                                                                                                                                                 | default value                                                     | Options                                                    |
| ----------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------- |
| autoFillOnNotFound            | boolean  | displays the result from autocomplete if the place details api return not found                                                                                                                                                             | false                                                             | true \| false                                              |
| autoFocus                     | boolean  | autoFocus the Text Input https://reactnative.dev/docs/textinput#autofocus                                                                                                                                                                   | no                                                                | true \| false                                              |
| currentLocation               | boolean  | Will add a 'Current location' button at the top of the predefined places list                                                                                                                                                               | false                                                             | true \| false                                              |
| currentLocationLabel          | string   | change the display label for the current location button                                                                                                                                                                                    | Current Location                                                  | Any string                                                 |
| debounce                      | number   | debounce the requests (in ms)                                                                                                                                                                                                               | 0                                                                 |                                                            |
| disableScroll                 | boolean  | disable scroll on the results list                                                                                                                                                                                                          |                                                                   |                                                            |
| editable                      | boolean  | editable from text input https://reactnative.dev/docs/textinput#editable                                                                                                                                                                    | true                                                              | true \| false                                              |
| enableHighAccuracyLocation    | boolean  | use GPS or not. If set to true, a GPS position will be requested. If set to false, a WIFI location will be requested. use GPS or not. If set to true, a GPS position will be requested. If set to false, a WIFI location will be requested. | true                                                              |                                                            |
| enablePoweredByContainer      | boolean  | show "powered by Google" at the bottom of the search results list                                                                                                                                                                           | true                                                              |                                                            |
| fetchDetails                  | boolean  | get more place details about the selected option from the Place Details API                                                                                                                                                                 | false                                                             |                                                            |
| filterReverseGeocodingByTypes | array    | filter the reverse geocoding results by types - ['locality', 'administrative_area_level_3'] if you want to display only cities                                                                                                              |                                                                   |                                                            |
| getDefaultValue               | function | Provides an initial value that will change when the user starts typing                                                                                                                                                                      |                                                                   |                                                            |
| GooglePlacesDetailsQuery      | object   | "query" object for the Google Place Details API (when you press on a suggestion)                                                                                                                                                            |                                                                   |                                                            |
| GooglePlacesSearchQuery       | object   | "query" object for the Google Places Nearby API (when you use current location to find nearby places)                                                                                                                                       | `{ rankby: 'distance', type: 'restaurant' }`                      |                                                            |
| GoogleReverseGeocodingQuery   | object   | "query" object for the Google Geocode API (when you use current location to get the current address)                                                                                                                                        |                                                                   |                                                            |
| isRowScrollable               | boolean  | enable/disable horizontal scrolling of a list result https://reactnative.dev/docs/scrollview#scrollenabled                                                                                                                                  | true                                                              |                                                            |
| keyboardAppearance            | enum     | keyboard appearance (iOS) https://reactnative.dev/docs/textinput#keyboardappearance                                                                                                                                                         | 'default'                                                         | 'default' \| 'light' \| 'dark'                             |
| keyboardShouldPersistTaps     | string   | Determines when the keyboard should stay visible after a tap https://reactnative.dev/docs/scrollview#keyboardshouldpersisttaps                                                                                                              | 'always'                                                          | 'never' \| 'always' \| 'handled'                           |
| listEmptyComponent            | function | use FlatList's ListEmptyComponent prop when no autocomplete results are found.                                                                                                                                                              |                                                                   |                                                            |
| listUnderlayColor             | string   | underlay color of the list result when pressed https://reactnative.dev/docs/touchablehighlight#underlaycolor                                                                                                                                | '#c8c7cc'                                                         |                                                            |
| listViewDisplayed             | string   | override the default behavior of showing the list (results) view                                                                                                                                                                            | 'auto'                                                            | 'auto' \| true \| false                                    |
| minLength                     | number   | minimum length of text to trigger a search                                                                                                                                                                                                  | 0                                                                 |                                                            |
| nearbyPlacesAPI               | string   | which API to use for current location                                                                                                                                                                                                       | 'GooglePlacesSearch'                                              | 'none' \| 'GooglePlacesSearch' \| 'GoogleReverseGeocoding' |
| numberOfLines                 | number   | number of lines (android - multiline must be set to true) https://reactnative.dev/docs/textinput#numberoflines                                                                                                                              | 1                                                                 |                                                            |
| onFail                        | function | returns if an unspecified error comes back from the API                                                                                                                                                                                     |                                                                   |                                                            |
| onNotFound                    | function | returns if the Google Places Details API returns a 'not found' code (when you press a suggestion).                                                                                                                                          |                                                                   |                                                            |
| onPress                       | function | returns when after a suggestion is selected                                                                                                                                                                                                 |                                                                   |                                                            |
| onSubmitEditing               | function | Callback that is called when the text input's submit button is pressed with the argument https://reactnative.dev/docs/textinput#onsubmitediting                                                                                             |                                                                   |                                                            |
| onTimeout                     | function | callback when a request timeout                                                                                                                                                                                                             | `()=>console.warn('google places autocomplete: request timeout')` |                                                            |
| placeholder                   | string   | placeholder text https://reactnative.dev/docs/textinput#placeholder                                                                                                                                                                         | 'Search'                                                          |                                                            |
| placeholderTextColor          | string   | placeholder text color https://reactnative.dev/docs/textinput#placeholdertextcolor                                                                                                                                                          | '#A8A8A8'                                                         | https://reactnative.dev/docs/colors                        |
| predefinedPlaces              | array    | Allows you to show pre-defined places (e.g. home, work)                                                                                                                                                                                     |                                                                   |                                                            |
| predefinedPlacesAlwaysVisible | boolean  | Shows predefined places at the top of the search results                                                                                                                                                                                    | false                                                             |                                                            |
| preProcess                    | function | do something to the text of the search input before a search request is sent                                                                                                                                                                |                                                                   |                                                            |
| query                         | object   | "query" object for the Google Places Autocomplete API (link)                                                                                                                                                                                | `{ key: 'missing api key', language: 'en', types: 'geocode' }`    |                                                            |
| renderDescription             | function | determines the data passed to each renderRow (search result)                                                                                                                                                                                |                                                                   |                                                            |
| renderHeaderComponent         | function | use the `ListHeaderComponent` from `FlatList` when showing autocomplete results                                                                                                                                                             |                                                                   |                                                            |
| renderLeftButton              | function | add a component to the left side of the Text Input                                                                                                                                                                                          |                                                                   |                                                            |
| renderRightButton             | function | add a component to the right side of the Text Input                                                                                                                                                                                         |                                                                   |                                                            |
| renderRow                     | function | custom component to render each result row (use this to show an icon beside each result)                                                                                                                                                    |                                                                   |                                                            |
| requestUrl                    | object   | used to set the request url for the library                                                                                                                                                                                                 |                                                                   |                                                            |
| returnKeyType                 | string   | the return key text https://reactnative.dev/docs/textinput#returnkeytype                                                                                                                                                                    | 'search'                                                          |                                                            |
| styles                        | object   | See styles section below                                                                                                                                                                                                                    |                                                                   |                                                            |
| suppressDefaultStyles         | boolean  | removes all default styling from the library                                                                                                                                                                                                | false                                                             | true \| false                                              |
| textInputHide                 | boolean  | Hide the Search input                                                                                                                                                                                                                       | false                                                             | true \| false                                              |
| textInputProps                | object   | define props for the [textInput](https://reactnative.dev/docs/textinput), or provide a custom input component                                                                                                                               |                                                                   |                                                            |
| timeout                       | number   | how many ms until the request will timeout                                                                                                                                                                                                  | 20000                                                             |                                                            |
| underlineColorAndroid         | string   | Text Input underline color (android) https://reactnative.dev/docs/textinput#underlinecolorandroid                                                                                                                                           | 'transparent'                                                     |                                                            |

## Methods

| method name      | type                      | description                   |
| ---------------- | ------------------------- | ----------------------------- |
| `getAddressText` | `() => string`            | return the value of TextInput |
| `setAddressText` | `(value: string) => void` | set the value of TextInput    |

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

#### Example

```js
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

## Compatibility

This library does not use the iOS, Android or JS SDKs from Google. This comes with some Pros and Cons.

**Pros:**

- smaller app size
- better privacy for your users (although Google still tracks server calls)
- no need to keep up with sdk updates

**Cons:**

- the library is not compatible with a Application key restrictions
- doesn't work directly on the web without a proxy server
- any Google API change can be a breaking change for the library.

## Changelog

Please see the [releases](https://github.com/FaridSafi/react-native-google-places-autocomplete/releases) tab for the changelog information.

## License

[MIT](LICENSE)

### Authors

- [Farid Safi](https://www.twitter.com/FaridSafi)
- [Maxim Yaskevich](https://www.twitter.com/mayaskme)
- [Guilherme Pontes](https://www.twitter.com/guiiipontes)
