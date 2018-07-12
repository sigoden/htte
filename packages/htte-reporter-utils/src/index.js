
var tty = require('tty');
var isatty = tty.isatty(1) && tty.isatty(2);

/**
 * Default color map.
 */
exports.colors = {
  pass: 90,
  fail: 31,
  'bright pass': 92,
  'bright fail': 91,
  'bright yellow': 93,
  pending: 36,
  suite: 0,
  'error title': 0,
  'error message': 31,
  'error stack': 90,
  checkmark: 32,
  fast: 90,
  medium: 33,
  slow: 31,
  green: 32,
  light: 90,
  'diff gutter': 90,
  'diff added': 32,
  'diff removed': 31
};

/**
 * Default symbol map.
 */
exports.symbols = {
  ok: '✓',
  err: '✖'
};

// With node.js on Windows: use symbols available in terminal default fonts
if (process.platform === 'win32') {
  exports.symbols.ok = '\u221A';
  exports.symbols.err = '\u00D7';
  exports.symbols.dot = '.';
}

/**
 * Color `str` with the given `type`,
 * allowing colors to be disabled,
 * as well as user-defined color
 * schemes.
 *
 * @param {string} type
 * @param {string} str
 * @return {string}
 * @api private
 */
exports.color = function(type, str) {
  return '\u001b[' + exports.colors[type] + 'm' + str + '\u001b[0m';
};

/**
 * Expose term window size, with some defaults for when stderr is not a tty.
 */
exports.window = {
  width: 75
};

if (isatty) {
  exports.window.width = process.stdout.getWindowSize
    ? process.stdout.getWindowSize(1)[0]
    : tty.getWindowSize()[1];
}

/**
 * Expose some basic cursor interactions that are common among reporters.
 */

exports.cursor = {
  hide: function() {
    isatty && process.stdout.write('\u001b[?25l');
  },

  show: function() {
    isatty && process.stdout.write('\u001b[?25h');
  },

  deleteLine: function() {
    isatty && process.stdout.write('\u001b[2K');
  },

  beginningOfLine: function() {
    isatty && process.stdout.write('\u001b[0G');
  },

  CR: function() {
    if (isatty) {
      exports.cursor.deleteLine();
      exports.cursor.beginningOfLine();
    } else {
      process.stdout.write('\r');
    }
  }
}

/**
 * Expose some basic cursor interactions that are common among reporters.
 */

exports.cursor = {
  hide: function() {
    isatty && process.stdout.write('\u001b[?25l');
  },

  show: function() {
    isatty && process.stdout.write('\u001b[?25h');
  },

  deleteLine: function() {
    isatty && process.stdout.write('\u001b[2K');
  },

  beginningOfLine: function() {
    isatty && process.stdout.write('\u001b[0G');
  },

  CR: function() {
    if (isatty) {
      exports.cursor.deleteLine();
      exports.cursor.beginningOfLine();
    } else {
      process.stdout.write('\r');
    }
  }
};

exports.ms = require('./ms');