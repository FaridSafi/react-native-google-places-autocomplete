/**
 * Trailing-edge debounce, replacing `lodash.debounce`.
 *
 * A wait of 0 still defers to the next tick, matching lodash's behaviour and
 * the existing default of `debounce={0}`.
 */
export const debounce = (fn, wait = 0) => {
  let timeoutId = null;

  const debounced = function (...args) {
    const context = this;

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      fn.apply(context, args);
    }, wait);
  };

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
};
