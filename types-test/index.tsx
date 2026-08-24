// Compile-time test for GooglePlacesAutocomplete.d.ts. Run with `yarn typecheck`.
import * as React from 'react';
import {
  GooglePlacesAutocomplete,
  GooglePlacesAutocompleteRef,
} from '../GooglePlacesAutocomplete';

// placeholder and query are optional now.
const Minimal = () => <GooglePlacesAutocomplete />;

const Full = () => {
  const ref = React.useRef<GooglePlacesAutocompleteRef>(null);

  React.useEffect(() => {
    ref.current?.setAddressText('Paris');
    const text: string = ref.current?.getAddressText() ?? '';
    ref.current?.focus();
    ref.current?.blur();
    ref.current?.clear();
    const focused: boolean | undefined = ref.current?.isFocused();
    ref.current?.getCurrentLocation();
    return () => {
      void text;
      void focused;
    };
  }, []);

  return (
    <GooglePlacesAutocomplete
      ref={ref}
      placeholder='Search'
      query={{ key: 'k', language: 'en' }}
      nearbyPlacesAPI='None'
      onNotFound={(response) => console.log(response)}
      renderDescription={(row) => row.description}
      renderHeaderComponent={(text) => <>{text}</>}
      inbetweenCompo={<></>}
      fetchDetails
      onPress={(data, details) => console.log(data.place_id, details?.name)}
    >
      <></>
    </GooglePlacesAutocomplete>
  );
};

export { Minimal, Full };
