/**
 * RFC4122 version 4 UUID generator.
 *
 * Replaces `react-native-uuid` (448 KB installed) for the one thing this
 * library needs it for: Places API session tokens.
 */

const BYTE_TO_HEX = [];
for (let i = 0; i < 256; i++) {
  BYTE_TO_HEX.push((i + 0x100).toString(16).slice(1));
}

const randomBytes = (length) => {
  const bytes = new Uint8Array(length);

  // Available on web, and on Hermes/JSC in recent React Native versions.
  const cryptoObj =
    typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;

  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    cryptoObj.getRandomValues(bytes);
    return bytes;
  }

  for (let i = 0; i < length; i++) {
    bytes[i] = (Math.random() * 256) | 0;
  }
  return bytes;
};

export const uuidv4 = () => {
  const bytes = randomBytes(16);

  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx

  const hex = BYTE_TO_HEX;
  return (
    hex[bytes[0]] +
    hex[bytes[1]] +
    hex[bytes[2]] +
    hex[bytes[3]] +
    '-' +
    hex[bytes[4]] +
    hex[bytes[5]] +
    '-' +
    hex[bytes[6]] +
    hex[bytes[7]] +
    '-' +
    hex[bytes[8]] +
    hex[bytes[9]] +
    '-' +
    hex[bytes[10]] +
    hex[bytes[11]] +
    hex[bytes[12]] +
    hex[bytes[13]] +
    hex[bytes[14]] +
    hex[bytes[15]]
  );
};
