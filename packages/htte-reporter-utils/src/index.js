const tty = require('tty');
const os = require('os');
const isatty = tty.isatty(1) && tty.isatty(2);
const supportsColor = require('supports-color');
const ms = require('./ms');
const { sprintf } = require('sprintf-js');
const yaml = require('js-yaml');

const useColors = supportsColor.stdout && !process.env.NO_COLOR;

function print() {
  let string = arguments[0];
  if (arguments.length !== 1) {
    string = sprintf.apply(sprintf, arguments);
  }
  process.stdout.write(string + os.EOL);
}

/**
 * Default color map.
 */
const colors = {
  title: 0,
  content: 90,
  pass: 90,
  skip: 36,
  fail: 31,
  pending: 36,
  error: 31,
  okmark: 32,
  errmark: 200,
  fast: 90,
  medium: 33,
  slow: 31,
  green: 32,
  ms: 90
};

/**
 * Default symbol map.
 */
const symbols = {
  ok: '✔',
  err: '✗',
  dot: '•'
};

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
function color(type, str) {
  if (!useColors) {
    return String(str);
  }
  return '\u001b[' + colors[type] + 'm' + str + '\u001b[0m';
};

/**
 * Output the units failures as a list.
 *
 */
function listFailures(units) {
  print();
  units
    .filter(function(unit) { return unit.session.err })
    .forEach(function(unit, i) {
      let err = unit.session.err;
      if (err) {
        let title = [unit.ctx.module].concat(unit.ctx.groups, [unit.describe]).join('->');
        let indents = ' '.repeat(i+3);
        print(color('title', '%d) %s'), i+1, title);
        if (err.parts) {
          print(color('error', indents + 'at %s, throw %s'), err.parts.join(symbols.dot), err.message);
        } else {
          print(color('error', indents + err.message));
        }
        if (unit.metadata.debug) {
          let { req, res = {} } = unit.session;
          print(color('content', '%s'), dump({ req, res }));
        }
      }
    })
};

function dump(obj, indents = '') {
  return yaml.safeDump(obj).split(os.EOL).map(function(line) {
    return indents + line;
  }).join(os.EOL);
}

/**
 * Output common epilogue used by many of
 * the bundled reporters.
 *
 */
exports.epilogue = function({ units, duration}) {

  let stats = { skips: 0, failures: 0, passes: 0 };
  units.map(function(unit) {
    if (unit.session.state === 'fail') {
      stats.failures += 1;
    } else if (unit.session.state === 'skip') {
      stats.skips += 1;
    } else if (unit.session.state === 'pass') {
      stats.passes += 1;
    }
  });

  let fmt;
  print();
  // passes
  fmt =
    color('green', '%d passing') +
    color('ms', ' (%s)');

  print(fmt, stats.passes || 0, ms(duration));

  // skip
  if (stats.skips) {
    fmt = color('skip', '%d skipping');

    print(fmt, stats.skips);
  }

  // failures
  if (stats.failures) {
    fmt = color('fail', '%d failing');

    print(fmt, stats.failures);

    listFailures(units);
    listDebugs(units);
    print();
  }

  print();
};

function listDebugs(units) {
  print();
  units
    .filter(function(unit) { return !unit.session.err && unit.metadata.debug })
    .forEach(function(unit, i) {
      let title = [unit.ctx.module].concat(unit.ctx.groups, [unit.describe]).join('->');
      print(color('title', '%s'), title);
      let { req, res = {} } = unit.session;
      print(color('content', '%s'), dump({ req, res }));
    });
}

/**
 * Detect the speed of unit.
 */
exports.speed = function(duration, basis) {
  if (duration > basis) {
    return 'slow';
  } else if (duration > basis / 2) {
    return 'medium';
  } else {
    return 'fast';
  }
}

/**
 * Show spinner
 */

exports.spinner = function(print, interval, spinnerMarks = '◴◷◶◵') {
  let i = 0;
  let handler = setInterval(function() {
    process.stdout.cursorTo(0);
    i = (i + 1) % spinnerMarks.length;
    process.stdout.write(print(spinnerMarks[i]));
  }, interval);
  return function() {
    process.stdout.cursorTo(0);
    clearInterval(handler);
  }
}

/**
 * Expose term window size, with some defaults for when stderr is not a tty.
 */
exports.window = { width: 75 };
if (isatty) {
  exports.window.width = process.stdout.getWindowSize
    ? process.stdout.getWindowSize(1)[0]
    : tty.getWindowSize()[1];
}

exports.sprintf = sprintf;
exports.colors = colors;
exports.ms = ms;
exports.color = color;
exports.print = print;
exports.symbols = symbols;
exports.useColors = useColors;
exports.listFailures = listFailures;

// With node.js on Windows: use symbols available in terminal default fonts
if (process.platform === 'win32') {
  exports.symbols.ok = '\u221A';
  exports.symbols.err = '\u00D7';
  exports.symbols.dot = '*';
}
exports.listDebugs = listDebugs;