/* eslint-env jest */
import { debounce } from '../src/debounce';

describe('debounce', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('invokes once with the trailing arguments', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced('a');
    debounced('b');
    debounced('c');
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('c');
  });

  it('restarts the timer on each call', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced('a');
    jest.advanceTimersByTime(90);
    debounced('b');
    jest.advanceTimersByTime(90);
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(10);
    expect(fn).toHaveBeenCalledWith('b');
  });

  it('still defers with a wait of 0', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 0);

    debounced('a');
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(0);
    expect(fn).toHaveBeenCalledWith('a');
  });

  it('cancel() prevents a pending invocation', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced('a');
    debounced.cancel();
    jest.advanceTimersByTime(1000);
    expect(fn).not.toHaveBeenCalled();
  });

  it('preserves the receiver', () => {
    const spy = jest.fn();
    const obj = {
      value: 42,
      method: debounce(function () {
        spy(this.value);
      }, 10),
    };

    obj.method();
    jest.advanceTimersByTime(10);
    expect(spy).toHaveBeenCalledWith(42);
  });
});
