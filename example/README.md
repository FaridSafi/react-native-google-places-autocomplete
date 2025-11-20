# Google Places Autocomplete Example

This is an example Expo project to test the `react-native-google-places-autocomplete` library locally.

## Setup

1. **Install dependencies:**

   ```bash
   cd example
   npm install
   # or
   yarn install
   ```

2. **Get your Google Places API Key:**

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the "Places API" (Web Service)
   - Create credentials (API Key)
   - Optionally, enable "Geocoding API" if you want to use current location features

3. **Add your API Key:**

   - Open `App.js`
   - Replace `YOUR_API_KEY_HERE` with your actual Google Places API key

4. **Run the app:**

   ```bash
   npm start
   # or
   yarn start
   ```

   Then press:

   - `i` for iOS simulator
   - `a` for Android emulator
   - `w` for web browser

## Features Demonstrated

This example app demonstrates:

- **Basic Search**: Simple autocomplete search functionality
- **Current Location**: Using the current location feature
- **Predefined Places**: Adding predefined places like Home and Work
- **Place Details**: Fetching detailed information about selected places

## Testing Local Changes

Since this example uses `file:..` to link to the parent library, any changes you make to the library files in the parent directory will be reflected in this example app. You may need to:

1. Restart the Expo development server after making changes to the library
2. Clear the cache if changes aren't reflected: `npm start -- --clear` or `yarn start --clear`

## Notes

- Make sure you have the Expo CLI installed globally: `npm install -g expo-cli` (optional, as npx can be used)
- For iOS, you'll need Xcode installed
- For Android, you'll need Android Studio and an emulator set up
- The library requires a valid Google Places API key to function
