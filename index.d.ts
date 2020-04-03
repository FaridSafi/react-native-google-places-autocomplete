import React from 'react';

export interface QueryProp {
    key: string,
    language?: string,
    origin?: string,
    types?: string,
    sessionToken?: string
}

export interface TextInputProps {
    onChangeText?: any,
}

export interface GooglePlacesAutocompleteProps {
    listViewDisplayed?: string | boolean | undefined,
    placeholder?: string,
    placeholderTextColor?: string,
    underlineColorAndroid?: string,
    returnKeyType?: string,
    keyboardAppearance?: 'default' | 'light' | 'dark',
    minLength?: number,
    fetchDetails?: boolean,
    autoFocus?: boolean,
    autoFillOnNotFound?: boolean,
    timeout?: number,
    query?: QueryProp,
    GoogleReverseGeocodingQuery?: object,
    GooglePlacesSearchQuery?: object,
    GooglePlacesDetailsQuery?: object,
    styles?: object,
    textInputProps?: TextInputProps,
    enablePoweredByContainer?: boolean,
    currentLocation?: boolean,
    currentLocationLabel?: string,
    nearbyPlacesAPI?: string,
    enableHighAccuracyLocation?: boolean,
    filterReverseGeocodingByTypes?: any[],
    predefinedPlacesAlwaysVisible?: boolean,
    enableEmptySections?: boolean,
    listUnderlayColor?: string,
    debounce?: number,
    isRowScrollable?: boolean,
    text?: string,
    textInputHide?: boolean,
    suppressDefaultStyles?: boolean,
    numberOfLines?: number,
    editable?: boolean
    predefinedPlaces?: any[],

    // functions
    onSubmitEditing?: any,
    onPress?: any,
    onNotFound?: any,
    onFail?: any,
    getDefaultValue?: any,
    onTimeout?: any,
    renderDescription?: any,
    renderRow?: any,
    renderLeftButton?: any,
    renderRightButton?: any,
}

export class GooglePlacesAutocomplete extends React.Component<GooglePlacesAutocompleteProps> {
}
