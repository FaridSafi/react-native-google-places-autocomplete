/**
 * Drop-in replacement for the subset of `qs.stringify` this library uses.
 *
 * Matches `qs` defaults exactly: RFC3986 percent-encoding, `undefined` values
 * omitted, `null` serialised as a bare `key=`, arrays in `indices` format
 * (`a[0]=x`) and nested objects in bracket format (`a[b]=x`).
 */

// encodeURIComponent leaves !'()* alone; RFC3986 (and therefore qs) does not.
const encode = (value) =>
  encodeURIComponent(String(value)).replace(
    /[!'()*]/g,
    (char) => '%' + char.charCodeAt(0).toString(16).toUpperCase(),
  );

const append = (parts, key, value) => {
  if (value === undefined) {
    return;
  }

  if (value === null) {
    parts.push(`${encode(key)}=`);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => append(parts, `${key}[${index}]`, item));
    return;
  }

  if (typeof value === 'object') {
    Object.keys(value).forEach((nestedKey) =>
      append(parts, `${key}[${nestedKey}]`, value[nestedKey]),
    );
    return;
  }

  parts.push(`${encode(key)}=${encode(value)}`);
};

export const stringify = (params) => {
  if (!params) {
    return '';
  }

  const parts = [];
  Object.keys(params).forEach((key) => append(parts, key, params[key]));
  return parts.join('&');
};
