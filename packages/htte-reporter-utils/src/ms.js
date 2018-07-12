/**
 * Helpers.
 */

const s = 1000;
const m = s * 60;
const h = m * 60;
const d = h * 24;
const y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * @memberof Mocha
 * @public
 * @api public
 * @param {string|number} val
 * @return {string|number}
 */
module.exports = function(val) {
  if (typeof val === 'string') {
    return parse(val);
  }
  return format(val);
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @api private
 * @param {string} str
 * @return {number}
 */
function parse(str) {
  let match = /^((?:\d+)?\.?\d+) *(ms|seconds?|s|minutes?|m|hours?|h|days?|d|years?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  let n = parseFloat(match[1]);
  let type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 's':
      return n * s;
    case 'ms':
      return n;
    default:
    // No default case
  }
}

/**
 * Format for `ms`.
 *
 * @api private
 * @param {number} ms
 * @return {string}
 */
function format(ms) {
  if (ms >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (ms >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (ms >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (ms >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}