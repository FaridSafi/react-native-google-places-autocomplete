import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Replace with your Google Places API Key
const GOOGLE_PLACES_API_KEY = 'YOUR_API_KEY_HERE';

export default function App() {
  const [selectedPlace, setSelectedPlace] = useState(null);

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={styles.container}
        edges={['top', 'bottom', 'left', 'right']}
      >
        <StatusBar style='auto' />
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            style={styles.scrollView}
            keyboardShouldPersistTaps='handled'
            contentContainerStyle={styles.contentContainer}
            nestedScrollEnabled={true}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Google Places Autocomplete</Text>
              <Text style={styles.subtitle}>Example App</Text>
            </View>

            <View style={styles.section}>
              <GooglePlacesAutocomplete
                placeholder='Search for a place'
                onPress={(data, details = null) => {
                  console.log('Selected place:', data);
                  console.log('Place details:', details);
                  setSelectedPlace({ data, details });
                  Alert.alert('Place Selected', data.description);
                }}
                query={{
                  key: GOOGLE_PLACES_API_KEY,
                  language: 'en',
                }}
                fetchDetails={true}
                styles={{
                  textInputContainer: {
                    backgroundColor: 'transparent',
                    borderTopWidth: 0,
                    borderBottomWidth: 0,
                  },
                  textInput: {
                    marginLeft: 0,
                    marginRight: 0,
                    height: 50,
                    color: '#5d5d5d',
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: '#ddd',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                  },
                  predefinedPlacesDescription: {
                    color: '#1faadb',
                  },
                }}
                debounce={200}
              />
            </View>

            {selectedPlace && (
              <View style={styles.resultSection}>
                <Text style={styles.sectionTitle}>Selected Place</Text>
                <View style={styles.resultBox}>
                  <Text style={styles.resultLabel}>Description:</Text>
                  <Text style={styles.resultText}>
                    {selectedPlace.data.description}
                  </Text>
                  {selectedPlace.details && (
                    <>
                      <Text style={styles.resultLabel}>Address:</Text>
                      <Text style={styles.resultText}>
                        {selectedPlace.details.formatted_address}
                      </Text>
                      {selectedPlace.details.geometry && (
                        <>
                          <Text style={styles.resultLabel}>Coordinates:</Text>
                          <Text style={styles.resultText}>
                            Lat: {selectedPlace.details.geometry.location.lat},
                            Lng: {selectedPlace.details.geometry.location.lng}
                          </Text>
                        </>
                      )}
                    </>
                  )}
                </View>
              </View>
            )}

            {GOOGLE_PLACES_API_KEY === 'YOUR_API_KEY_HERE' && (
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Make sure to replace YOUR_API_KEY_HERE with your actual Google
                  Places API key in App.js
                </Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  resultSection: {
    marginTop: 24,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resultBox: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  resultText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  footer: {
    marginTop: 16,
    marginBottom: 32,
    padding: 12,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  footerText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
  },
});
