import React, { memo, useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { defaultStyles } from './styles';

const Loader = () => <ActivityIndicator animating={true} size='small' />;

/**
 * A single suggestion row.
 *
 * Memoised, and — unlike the previous implementation — it only mounts a
 * horizontal ScrollView when `isRowScrollable` is actually on. A native scroll
 * view per row is expensive, and the list renders one per suggestion.
 */
const Row = memo(function Row({
  rowData,
  index,
  isLoading,
  isRowScrollable,
  keyboardShouldPersistTaps,
  listHoverColor,
  listUnderlayColor,
  mergedStyles,
  numberOfLines,
  onBlur,
  onPress,
  renderDescription,
  renderRow,
  suppressDefaultStyles,
}) {
  const handlePress = useCallback(() => onPress(rowData), [onPress, rowData]);

  const widthStyle = isRowScrollable
    ? defaultStyles.minFullWidth
    : defaultStyles.fullWidth;

  const pressableStyle = useCallback(
    ({ hovered, pressed }) => [
      widthStyle,
      {
        backgroundColor: pressed
          ? listUnderlayColor
          : hovered
          ? listHoverColor
          : undefined,
      },
    ],
    [widthStyle, listUnderlayColor, listHoverColor],
  );

  const content = (
    <Pressable style={pressableStyle} onPress={handlePress} onBlur={onBlur}>
      <View
        style={
          rowData.isPredefinedPlace
            ? mergedStyles.specialItemRow
            : mergedStyles.row
        }
      >
        {isLoading ? (
          <View style={mergedStyles.loader}>
            <Loader />
          </View>
        ) : null}
        {renderRow ? (
          renderRow(rowData, index)
        ) : (
          <Text
            style={
              rowData.isPredefinedPlace
                ? mergedStyles.predefinedPlacesDescription
                : mergedStyles.description
            }
            numberOfLines={numberOfLines}
          >
            {renderDescription(rowData)}
          </Text>
        )}
      </View>
    </Pressable>
  );

  if (!isRowScrollable) {
    return content;
  }

  return (
    <ScrollView
      contentContainerStyle={defaultStyles.minFullWidth}
      scrollEnabled={true}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      horizontal={true}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
    >
      {content}
    </ScrollView>
  );
});

export default Row;
