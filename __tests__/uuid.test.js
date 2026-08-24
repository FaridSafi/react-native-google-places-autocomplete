/* eslint-env jest */
import { uuidv4 } from '../src/uuid';

const RFC4122_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('uuidv4', () => {
  it('produces an RFC4122 version 4 UUID', () => {
    expect(uuidv4()).toMatch(RFC4122_V4);
  });

  it('does not repeat across many calls', () => {
    const seen = new Set();
    for (let i = 0; i < 10000; i++) {
      seen.add(uuidv4());
    }
    expect(seen.size).toBe(10000);
  });
});
