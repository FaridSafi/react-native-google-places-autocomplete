/* eslint-env jest */
import Qs from 'qs';

import { stringify } from '../src/queryString';

// `qs` is kept as a devDependency purely as a test oracle: it proves the
// hand-rolled replacement is byte-for-byte compatible for every shape this
// library actually sends to the Google APIs.
const CASES = [
  { key: 'abc123', language: 'en', types: 'geocode' },
  { latlng: '48.8566,2.3522', key: 'abc123' },
  {
    location: '48.8566,2.3522',
    key: 'k',
    rankby: 'distance',
    type: 'restaurant',
  },
  { key: 'k', placeid: 'ChIJ_abc', language: 'fr' },
  { components: 'country:us|country:ca', key: 'k' },
  { key: 'k', strictbounds: true, offset: 3, radius: 1000 },
  { key: 'k', sessionToken: 'tok', fields: '*' },
  { key: 'k', empty: '', zero: 0, no: false },
  { key: 'k', skipped: undefined, kept: null },
  { key: 'k', types: ['geocode', 'establishment'] },
  { key: 'k', nested: { a: 1, b: 'two' } },
  { 'weird key': 'value with spaces & symbols=?/#' },
  { unicode: 'Zürich Hauptbahnhof' },
  {},
];

describe('stringify', () => {
  it.each(CASES.map((c) => [JSON.stringify(c), c]))(
    'matches qs.stringify for %s',
    (_label, input) => {
      expect(stringify(input)).toBe(Qs.stringify(input));
    },
  );

  it('returns an empty string for nullish input', () => {
    expect(stringify(undefined)).toBe('');
    expect(stringify(null)).toBe('');
  });
});
