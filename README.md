<a href="https://www.npmjs.com/package/react-native-google-places-autocomplete">
  <img alt="npm version" src="https://img.shields.io/npm/v/react-native-google-places-autocomplete"/>
</a>

# Google Maps Search Component for React Native

**Customizable Google Places autocomplete component for iOS and Android React-Native apps**

## Preview

![](https://raw.githubusercontent.com/FaridSafi/react-native-google-places-autocomplete/master/Assets/screenshot.png)

## Installation

**Step 1.**

```
npm install react-native-google-places-autocomplete --save
```

or

```
yarn add react-native-google-places-autocomplete
```

**Step 2.**

Get your [Google Places API keys](https://developers.google.com/maps/documentation/places/web-service/get-api-key/) and enable the appropriate API in the console:

- **For Legacy API:** Enable "Google Places API Web Service" (NOT Android or iOS)
- **For New Places API:** Enable "Places API (New)" at https://console.cloud.google.com/apis/library/places.googleapis.com

Billing must be enabled on the account.

**Step 3.**

Enable "Google Maps Geocoding API" if you want to use GoogleReverseGeocoding for Current Location

## Basic Example

**Basic Address Search**

```js
import React from 'react';
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

**Use a custom Text Input Component**

<details>
  <summary>Click to expand</summary>

This is an example using the Text Input from [`react-native-elements`](https://reactnativeelements.com/docs/components/input).

```js
import React from 'react';
import { Text, View, Image } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Input } from 'react-native-elements';

const GOOGLE_PLACES_API_KEY = 'YOUR_GOOGLE_API_KEY';

const GooglePlacesInput = () => {
  return (
    <GooglePlacesAutocomplete
      query={{
        key: GOOGLE_PLACES_API_KEY,
        language: 'en', // language of the results
      }}
      onPress={(data, details) => console.log(data, details)}
      textInputProps={{
        InputComp: Input,
        leftIcon: { type: 'font-awesome', name: 'chevron-left' },
        errorStyle: { color: 'red' },
      }}
    />
  );
};

export default GooglePlacesInput;
```

</details>

## Props

_This list is a work in progress. PRs welcome!_

| Prop Name                     | type            | description                                                                                                                                                                                                                                                                                                                   | default value                                                     | Options                                                    |
| ----------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------- |
| autoFillOnNotFound            | boolean         | displays the result from autocomplete if the place details api return not found                                                                                                                                                                                                                                               | false                                                             | true \| false                                              |
| currentLocation               | boolean         | Will add a 'Current location' button at the top of the predefined places list                                                                                                                                                                                                                                                 | false                                                             | true \| false                                              |
| currentLocationLabel          | string          | change the display label for the current location button                                                                                                                                                                                                                                                                      | Current Location                                                  | Any string                                                 |
| debounce                      | number          | debounce the requests (in ms)                                                                                                                                                                                                                                                                                                 | 0                                                                 |                                                            |
| disableScroll                 | boolean         | disable scroll on the results list                                                                                                                                                                                                                                                                                            |                                                                   |                                                            |
| enableHighAccuracyLocation    | boolean         | use GPS or not. If set to true, a GPS position will be requested. If set to false, a WIFI location will be requested. use GPS or not. If set to true, a GPS position will be requested. If set to false, a WIFI location will be requested.                                                                                   | true                                                              |                                                            |
| enablePoweredByContainer      | boolean         | show "powered by Google" at the bottom of the search results list                                                                                                                                                                                                                                                             | true                                                              |                                                            |
| fetchDetails                  | boolean         | get more place details about the selected option from the Place Details API                                                                                                                                                                                                                                                   | false                                                             |                                                            |
| fields                        | string          | comma-separated list of fields to return for place details (new Places API only)                                                                                                                                                                                                                                              | '\*'                                                              |                                                            |
| filterReverseGeocodingByTypes | array           | filter the reverse geocoding results by types - ['locality', 'administrative_area_level_3'] if you want to display only cities                                                                                                                                                                                                |                                                                   |                                                            |
| GooglePlacesDetailsQuery      | object          | "query" object for the Google Place Details API (when you press on a suggestion)                                                                                                                                                                                                                                              |                                                                   |                                                            |
| GooglePlacesSearchQuery       | object          | "query" object for the Google Places Nearby API (when you use current location to find nearby places)                                                                                                                                                                                                                         | `{ rankby: 'distance', type: 'restaurant' }`                      |                                                            |
| GoogleReverseGeocodingQuery   | object          | "query" object for the Google Geocode API (when you use current location to get the current address)                                                                                                                                                                                                                          |                                                                   |                                                            |
| isNewPlacesAPI                | boolean         | enable the new Google Places API (places.googleapis.com) instead of the legacy API                                                                                                                                                                                                                                            | false                                                             | true \| false                                              |
| isRowScrollable               | boolean         | enable/disable horizontal scrolling of a list result https://reactnative.dev/docs/scrollview#scrollenabled                                                                                                                                                                                                                    | true                                                              |
| inbetweenCompo                | React.ReactNode | Insert a ReactNode in between the search bar and the search results Flatlist                                                                                                                                                                                                                                                  |
| keepResultsAfterBlur          | boolean         | show list of results after blur                                                                                                                                                                                                                                                                                               | false                                                             | true \| false                                              |
| keyboardShouldPersistTaps     | string          | Determines when the keyboard should stay visible after a tap https://reactnative.dev/docs/scrollview#keyboardshouldpersisttaps                                                                                                                                                                                                | 'always'                                                          | 'never' \| 'always' \| 'handled'                           |
| listEmptyComponent            | function        | use FlatList's ListEmptyComponent prop when no autocomplete results are found.                                                                                                                                                                                                                                                |                                                                   |                                                            |
| listLoaderComponent           | function        | show this component while results are loading.                                                                                                                                                                                                                                                                                |                                                                   |                                                            |
| listHoverColor                | string          | underlay color of the list result when hovered (web only)                                                                                                                                                                                                                                                                     | '#ececec'                                                         |                                                            |
| listUnderlayColor             | string          | underlay color of the list result when pressed https://reactnative.dev/docs/touchablehighlight#underlaycolor                                                                                                                                                                                                                  | '#c8c7cc'                                                         |                                                            |
| listViewDisplayed             | string          | override the default behavior of showing the list (results) view                                                                                                                                                                                                                                                              | 'auto'                                                            | 'auto' \| true \| false                                    |
| minLength                     | number          | minimum length of text to trigger a search                                                                                                                                                                                                                                                                                    | 0                                                                 |                                                            |
| nearbyPlacesAPI               | string          | which API to use for current location                                                                                                                                                                                                                                                                                         | 'GooglePlacesSearch'                                              | 'none' \| 'GooglePlacesSearch' \| 'GoogleReverseGeocoding' |
| numberOfLines                 | number          | number of lines (android - multiline must be set to true) https://reactnative.dev/docs/textinput#numberoflines                                                                                                                                                                                                                | 1                                                                 |                                                            |
| onFail                        | function        | returns if an unspecified error comes back from the API                                                                                                                                                                                                                                                                       |                                                                   |                                                            |
| onNotFound                    | function        | returns if the Google Places Details API returns a 'not found' code (when you press a suggestion).                                                                                                                                                                                                                            |                                                                   |                                                            |
| onPress                       | function        | returns when after a suggestion is selected                                                                                                                                                                                                                                                                                   |                                                                   |                                                            |
| onTimeout                     | function        | callback when a request timeout                                                                                                                                                                                                                                                                                               | `()=>console.warn('google places autocomplete: request timeout')` |                                                            |
| placeholder                   | string          | placeholder text https://reactnative.dev/docs/textinput#placeholder                                                                                                                                                                                                                                                           | 'Search'                                                          |                                                            |
| predefinedPlaces              | array           | Allows you to show pre-defined places (e.g. home, work)                                                                                                                                                                                                                                                                       |                                                                   |                                                            |
| predefinedPlacesAlwaysVisible | boolean         | Shows predefined places at the top of the search results                                                                                                                                                                                                                                                                      | false                                                             |                                                            |
| preProcess                    | function        | do something to the text of the search input before a search request is sent                                                                                                                                                                                                                                                  |                                                                   |                                                            |
| query                         | object          | "query" object for the Google Places Autocomplete API. For new Places API, supports: `key`, `language` (maps to `languageCode`), `includedRegionCodes` (array), `includeQueryPredictions` (boolean). For legacy API, see [options](https://developers.google.com/places/web-service/autocomplete#place_autocomplete_requests) | `{ key: 'missing api key', language: 'en', types: 'geocode' }`    |                                                            |
| renderDescription             | function        | determines the data passed to each renderRow (search result)                                                                                                                                                                                                                                                                  |                                                                   |                                                            |
| renderHeaderComponent         | function        | use the `ListHeaderComponent` from `FlatList` when showing autocomplete results                                                                                                                                                                                                                                               |                                                                   |                                                            |
| renderLeftButton              | function        | add a component to the left side of the Text Input                                                                                                                                                                                                                                                                            |                                                                   |                                                            |
| renderRightButton             | function        | add a component to the right side of the Text Input                                                                                                                                                                                                                                                                           |                                                                   |                                                            |
| renderRow                     | function        | custom component to render each result row (use this to show an icon beside each result). `data` and `index` will be passed as input parameters                                                                                                                                                                               |                                                                   |                                                            |
| requestUrl                    | object          | used to set the request url for the library                                                                                                                                                                                                                                                                                   |                                                                   |                                                            |
| returnKeyType                 | string          | the return key text https://reactnative.dev/docs/textinput#returnkeytype                                                                                                                                                                                                                                                      | 'search'                                                          |                                                            |
| styles                        | object          | See styles section below                                                                                                                                                                                                                                                                                                      |                                                                   |                                                            |
| suppressDefaultStyles         | boolean         | removes all default styling from the library                                                                                                                                                                                                                                                                                  | false                                                             | true \| false                                              |
| textInputHide                 | boolean         | Hide the Search input                                                                                                                                                                                                                                                                                                         | false                                                             | true \| false                                              |
| textInputProps                | object          | define props for the [textInput](https://reactnative.dev/docs/textinput), or provide a custom input component                                                                                                                                                                                                                 |                                                                   |                                                            |
| timeout                       | number          | how many ms until the request will timeout                                                                                                                                                                                                                                                                                    | 20000                                                             |                                                            |

## Methods

| method name          | type                      | description                                                             |
| -------------------- | ------------------------- | ----------------------------------------------------------------------- |
| `getAddressText`     | `() => string`            | return the value of TextInput                                           |
| `setAddressText`     | `(value: string) => void` | set the value of TextInput                                              |
| `focus`              | `void`                    | makes the TextInput focus                                               |
| `blur`               | `void`                    | makes the TextInput lose focus                                          |
| `clear`              | `void`                    | removes all text from the TextInput                                     |
| `isFocused`          | `() => boolean`           | returns `true` if the TextInput is currently focused; `false` otherwise |
| `getCurrentLocation` | `() => void`              | makes a query to find nearby places based on current location           |

You can access these methods using a ref.

### Example

```js
import React, { useEffect, useRef } from 'react';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const GooglePlacesInput = () => {
  const ref = useRef();

  useEffect(() => {
    ref.current?.setAddressText('Some Text');
  }, []);

  return (
    <GooglePlacesAutocomplete
      ref={ref}
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

## Styling

`GooglePlacesAutocomplete` can be easily customized to meet styles of your app. Pass styles props to `GooglePlacesAutocomplete` with style object for different elements (keys for style object are listed below)

| key                         | type                    |
| --------------------------- | ----------------------- |
| container                   | object (View)           |
| textInputContainer          | object (View style)     |
| textInput                   | object (style)          |
| listView                    | object (ListView style) |
| row                         | object (View style)     |
| loader                      | object (View style)     |
| description                 | object (Text style)     |
| predefinedPlacesDescription | object (Text style)     |
| separator                   | object (View style)     |
| poweredContainer            | object (View style)     |
| powered                     | object (Image style)    |

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
      backgroundColor: 'grey',
    },
    textInput: {
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

### Default Styles

```js
{
  container: {
    flex: 1,
  },
  textInputContainer: {
    flexDirection: 'row',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    height: 44,
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    fontSize: 15,
    flex: 1,
  },
  poweredContainer: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderBottomRightRadius: 5,
    borderBottomLeftRadius: 5,
    borderColor: '#c8c7cc',
    borderTopWidth: 0.5,
  },
  powered: {},
  listView: {},
  row: {
    backgroundColor: '#FFFFFF',
    padding: 13,
    height: 44,
    flexDirection: 'row',
  },
  separator: {
    height: 0.5,
    backgroundColor: '#c8c7cc',
  },
  description: {},
  loader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    height: 20,
  },
}
```

## Web Support

Web support can be enabled via the `requestUrl` prop, by passing in a URL that you can use to proxy your requests. CORS implemented by the Google Places API prevent using this library directly on the web. You will need to use a proxy server. Please be mindful of this limitation when opening an issue.

The `requestUrl` prop takes an object with two required properties: `useOnPlatform` and `url`, and an optional `headers` property.

The `url` property is used to set the url that requests will be made to.

`useOnPlatform` configures when the proxy url is used. It can be set to either `web`- will be used only when the device platform is detected as web (but not iOS or Android, or `all` - will always be used.

You can optionally specify headers to apply to your request in the `headers` object.

**Note:** When using `isNewPlacesAPI={true}`, headers (`X-Goog-Api-Key`, `X-Goog-FieldMask`, `Content-Type`) are automatically added, so you only need to provide them if you want to override the defaults. For the legacy API, headers must be manually provided for web requests.

### Using the Legacy Places API (Default)

If you are using the regular Google Maps API (not the new Places API), you need to make sure you are ultimately hitting `https://maps.googleapis.com/maps/api`.

**Required configuration for web:**

For the legacy API, you need to manually provide headers for web requests:

```js
import React from 'react';
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
      requestUrl={{
        url: 'https://maps.googleapis.com/maps/api',
        useOnPlatform: 'web',
        headers: {
          'X-Goog-Api-Key': 'YOUR API KEY',
          'Content-Type': 'application/json',
        },
      }}
    />
  );
};

export default GooglePlacesInput;
```

**Note:** For native platforms (iOS/Android), you can omit the `requestUrl` prop as the library will automatically use the correct endpoint.

### Using the New Places API

The new Places API (Places API (New)) is Google's latest version of the Places API with improved features and better performance. To use it, you need to:

1. Enable "Places API (New)" in your Google Cloud Console
2. Set `isNewPlacesAPI={true}`
3. For web platforms, configure the `requestUrl` prop with the correct endpoint (headers are optional and automatically added)

**Key Differences from Legacy API:**

- Uses `https://places.googleapis.com` endpoint instead of `https://maps.googleapis.com/maps/api`
- API key automatically added to headers as `X-Goog-Api-Key` (not in query parameters)
- Uses POST requests for autocomplete (instead of GET)
- `X-Goog-FieldMask` header automatically set with all necessary fields
- Different request/response structure
- Supports query predictions in addition to place predictions

**Required configuration for new Places API (Web):**

```js
import React from 'react';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const GooglePlacesInput = () => {
  return (
    <GooglePlacesAutocomplete
      placeholder='Search'
      isNewPlacesAPI={true}
      onPress={(data, details = null) => {
        // 'details' is provided when fetchDetails = true
        console.log(data, details);
      }}
      query={{
        key: 'YOUR API KEY',
        language: 'es', // Maps to languageCode in new API
        includedRegionCodes: ['us', 'mx'], // Optional: limit results to specific regions
        includeQueryPredictions: true, // Optional: include query predictions
      }}
      requestUrl={{
        url: 'https://places.googleapis.com',
        useOnPlatform: 'web',
        // Headers are optional - library automatically adds:
        // X-Goog-Api-Key, X-Goog-FieldMask, and Content-Type
        headers: {
          'X-Goog-Api-Key': 'YOUR API KEY', // Optional: auto-added if omitted
        },
      }}
    />
  );
};

export default GooglePlacesInput;
```

**Required configuration for new Places API (Native - iOS/Android):**

For native platforms, you can omit the `requestUrl` prop as the library will automatically use the correct endpoint:

```js
import React from 'react';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const GooglePlacesInput = () => {
  return (
    <GooglePlacesAutocomplete
      placeholder='Search'
      isNewPlacesAPI={true}
      onPress={(data, details = null) => {
        console.log(data, details);
      }}
      query={{
        key: 'YOUR API KEY',
        language: 'en',
        includedRegionCodes: ['us', 'mx'], // Optional
        includeQueryPredictions: true, // Optional
      }}
      fetchDetails={true}
      fields='id,name,formattedAddress,location' // Optional: specify fields to return
    />
  );
};

export default GooglePlacesInput;
```

**Important Notes:**

1. **Automatic Headers:** The library automatically adds required headers when using `isNewPlacesAPI={true}`:

   - `X-Goog-Api-Key`: From `query.key`
   - `X-Goog-FieldMask`: Automatically set with all necessary fields for autocomplete (placeId, structuredFormat, types, etc.)
   - `Content-Type`: Set to `application/json`

   You only need to provide these in `requestUrl.headers` if you want to override the defaults.

2. **Field Mask Warning:** ⚠️ Only override `X-Goog-FieldMask` if you know what you're doing. The default includes all fields needed for proper functionality:

   - `suggestions.placePrediction.text.text`
   - `suggestions.placePrediction.placeId` (required for fetching place details)
   - `suggestions.placePrediction.structuredFormat` (for main_text/secondary_text)
   - `suggestions.placePrediction.types`
   - `suggestions.queryPrediction.text.text`

   Omitting required fields (like `placeId`) will result in incomplete data and broken place details.

3. **Request Body Transformation:** The request body is automatically transformed:

   - `language` → `languageCode`
   - `includedRegionCodes` → passed as array
   - `includeQueryPredictions` → defaults to `true` if not specified

4. **Query Parameters:**

   - `includedRegionCodes` (array): Limit results to specific regions
   - `includeQueryPredictions` (boolean): Include query predictions (default: `true`)
   - `language` (string): Maps to `languageCode` in request body

5. **Response Format:** The library automatically transforms the new API response structure to match the legacy API format for compatibility.

6. **Place Details Fields:** Use the `fields` prop to specify which fields to return for place details. Default is `'*'` (all fields). Example: `fields="id,name,formattedAddress,location"`

7. **Session Tokens:** Automatically managed for billing optimization. A new token is generated for each autocomplete session and used for the corresponding place details request.

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
- [x] Support for new Places API (Places API (New))
- [x] Query predictions support
- [x] Automatic session token management

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

### Use Inside a `<ScrollView/>` or `<FlatList/>`

If you need to include this component inside a ScrolView or FlatList, remember to apply the `keyboardShouldPersistTaps` attribute to all ancestors ScrollView or FlatList (see [this](https://github.com/FaridSafi/react-native-google-places-autocomplete/issues/486#issuecomment-665602257) issue comment).

### Nested Scroll View

If you wrap the component inside a `ScrollView`, it would give you the following error:

```
VirtualizedLists should never be nested inside plain ScrollViews with the same orientation - use another VirtualizedList-backed container instead.
```

This occurs because `react-native-google-places-autocomplete` component uses a `FlatList` and `react-native` by default doesn't allow nested Scroll Views in the same direction (vertical/horizontal). One way to fix this is adding another wrapper of `ScrollView` with inverse value of the scroll direction.

```js
<ScrollView
  horizontal
  style={{ flex: 1, width: '100%', height: '100%' }}
  scrollEnabled={false}
>
  <GooglePlacesAutocomplete
  // rest of the code
  />
</ScrollView>
```

## A word about the Google Maps APIs

Google Provides a bunch of web APIs for finding an address or place, and getting it’s details.
There are the Google Places Web APIs ([Place Search](https://developers.google.com/places/web-service/search), [Place Details](https://developers.google.com/places/web-service/details), [Place Photos](https://developers.google.com/places/web-service/photos), [Place Autocomplete](https://developers.google.com/places/web-service/autocomplete), [Query Autocomplete](https://developers.google.com/places/web-service/query)) and the [Google Geocode API](https://developers.google.com/maps/documentation/geocoding/intro) .

The 5 Google Places Web APIs are:

- **Place Autocomplete -** automatically fills in the name and/or address of a place as users type.
- **Place Details -** returns more detailed information about a specific place (using a place_id that you get from Place Search, Place Autocomplete, or Query Autocomplete).
- **Place Photos -** provides access to the millions of place-related photos stored in Google's Place database (using a reference_id that you get from Place Search, Place Autocomplete, or Query Autocomplete).
- **Place Search -** returns a list of places based on a user's location or search string.
- **Query Autocomplete -** provides a query prediction service for text-based geographic searches, returning suggested queries as users type.

The **Geocoding API** allows you to convert an address into geographic coordinates (lat, long) and to "reverse geocode", which is the process of converting geographic coordinates into a human-readable address.

### Which APIs does this library use?

Place Autocomplete API, Place Details API, Place Search API and the Geocoding API.

We use the **Place Autocomplete API** to get suggestions as you type. When you click on a suggestion, we use the **Place Details API** to get more information about the place.

We use the **Geocoding API** and the **Place Search API** to use your current location to get results.

Because the query parameters are different for each API, there are 4 different "query" props.

1. Autocomplete -> `query` ([options](https://developers.google.com/places/web-service/autocomplete#place_autocomplete_requests))
2. Place Details -> `GooglePlacesDetailsQuery` ([options](https://developers.google.com/places/web-service/details#PlaceDetailsRequests))
3. Nearby Search -> `GooglePlacesSearchQuery` ([options](https://developers.google.com/places/web-service/search#PlaceSearchRequests))
4. Geocode -> `GoogleReverseGeocodingQuery` ([options](https://developers.google.com/maps/documentation/geocoding/intro#GeocodingRequests))

Number 1 is used while getting autocomplete results.  
Number 2 is used when you click on a result.  
Number 3 is used when you select 'Current Location' to load nearby results.  
Number 4 is used when `nearbyPlacesAPI='GoogleReverseGeocoding'` is set and you select 'Current Location' to load nearby results.

## Changelog

Please see the [releases](https://github.com/FaridSafi/react-native-google-places-autocomplete/releases) tab for the changelog information.

## License

[MIT](LICENSE)

### Authors

- [Farid Safi](https://www.twitter.com/FaridSafi)
- [Maxim Yaskevich](https://www.twitter.com/mayaskme)
- [Guilherme Pontes](https://www.twitter.com/guiiipontes)
