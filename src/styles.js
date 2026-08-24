import { StyleSheet } from 'react-native';

export const defaultStyles = StyleSheet.create({
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
    marginBottom: 5,
  },
  listView: {
    backgroundColor: '#FFFFFF',
  },
  row: {
    backgroundColor: '#FFFFFF',
    padding: 13,
    minHeight: 44,
    flexDirection: 'row',
  },
  loader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    height: 20,
  },
  description: {},
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#c8c7cc',
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
  fullWidth: {
    width: '100%',
  },
  minFullWidth: {
    minWidth: '100%',
  },
});

const EMPTY = {};

/**
 * Merge a default style with the consumer override once per style key, so the
 * render path stops allocating a fresh array for every element on every frame.
 */
export const mergeStyles = (styles, suppressDefaultStyles) => {
  const userStyles = styles || EMPTY;
  const base = (key) =>
    suppressDefaultStyles ? undefined : defaultStyles[key];

  return {
    container: [base('container'), userStyles.container],
    textInputContainer: [
      base('textInputContainer'),
      userStyles.textInputContainer,
    ],
    textInput: [base('textInput'), userStyles.textInput],
    listView: [base('listView'), userStyles.listView],
    row: [base('row'), userStyles.row],
    specialItemRow: [base('row'), userStyles.row, userStyles.specialItemRow],
    loader: [base('loader'), userStyles.loader],
    description: [base('description'), userStyles.description],
    predefinedPlacesDescription: [
      base('description'),
      userStyles.description,
      userStyles.predefinedPlacesDescription,
    ],
    separator: [base('separator'), userStyles.separator],
    poweredContainer: [
      base('row'),
      defaultStyles.poweredContainer,
      userStyles.poweredContainer,
    ],
    powered: [base('powered'), userStyles.powered],
  };
};
