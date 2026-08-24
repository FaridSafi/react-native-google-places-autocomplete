/* eslint-env jest */

/**
 * Minimal controllable XMLHttpRequest double.
 *
 * Every instance is recorded on `mockXhr.instances` so a test can assert on the
 * URL/method/body and then drive the response by hand.
 */
class MockXMLHttpRequest {
  constructor() {
    this.readyState = 0;
    this.status = 0;
    this.responseText = '';
    this.withCredentials = false;
    this.timeout = 0;
    this.ontimeout = null;
    this.onreadystatechange = null;
    this.headers = {};
    this.aborted = false;
    this.sent = false;
    this.body = undefined;
    MockXMLHttpRequest.instances.push(this);
  }

  open(method, url) {
    this.method = method;
    this.url = url;
    this.readyState = 1;
  }

  setRequestHeader(key, value) {
    this.headers[key] = value;
  }

  send(body) {
    this.sent = true;
    this.body = body;
  }

  abort() {
    this.aborted = true;
    this.readyState = 0;
  }

  /** Drive a successful JSON response through the readystate machine. */
  respond(json, status = 200) {
    if (this.aborted) {
      throw new Error('respond() called on an aborted request');
    }
    this.status = status;
    this.responseText = typeof json === 'string' ? json : JSON.stringify(json);
    this.readyState = 4;
    if (this.onreadystatechange) {
      this.onreadystatechange();
    }
  }

  /** Emit an intermediate readyState so loading indicators light up. */
  progress(readyState = 3) {
    this.readyState = readyState;
    if (this.onreadystatechange) {
      this.onreadystatechange();
    }
  }

  fail(status = 500) {
    this.status = status;
    this.responseText = '';
    this.readyState = 4;
    if (this.onreadystatechange) {
      this.onreadystatechange();
    }
  }
}

MockXMLHttpRequest.instances = [];

export const mockXhr = {
  install() {
    MockXMLHttpRequest.instances = [];
    global.XMLHttpRequest = MockXMLHttpRequest;
    return mockXhr;
  },
  get instances() {
    return MockXMLHttpRequest.instances;
  },
  get last() {
    return MockXMLHttpRequest.instances[
      MockXMLHttpRequest.instances.length - 1
    ];
  },
  /** Requests that were actually sent and not aborted. */
  get live() {
    return MockXMLHttpRequest.instances.filter((r) => r.sent && !r.aborted);
  },
  reset() {
    MockXMLHttpRequest.instances = [];
  },
};

export const PREDICTIONS = {
  predictions: [
    {
      description: 'Paris, France',
      place_id: 'paris-id',
      types: ['locality', 'political'],
      structured_formatting: { main_text: 'Paris', secondary_text: 'France' },
    },
    {
      description: 'Paris, TX, USA',
      place_id: 'paris-tx-id',
      types: ['locality', 'political'],
      structured_formatting: { main_text: 'Paris', secondary_text: 'TX, USA' },
    },
  ],
};
