const utils = require('htte-reporter-utils')
const defaultOptions = {
  slow: 1000
};

module.exports = function(htte, options) {
  options = Object.assign(defaultOptions, options);
  return function(emiter) {
    let clearSpinner;
    let current;
    let counterr = 0;

    emiter.on('start', function(args) {
      utils.print();
    });

    emiter.on('enterGroup', function(args) {
      let { unit } = args;
      unit.ctx.groups.map(function(group, index) {
        utils.print(utils.color('group', '%s%s'), indent(index), group);
      });
    });

    emiter.on('skipUnit', function(args) {
      let { unit } = args;
      utils.print(utils.color('skip', '%s %s%s'), utils.symbols.dot, indent(unit.ctx.groups.length), unit.describe);
    });

    emiter.on('runUnit', function(args) {
      let { unit } = args;
      current = unit;
      clearSpinner = utils.spinner(function(mark) {
        return utils.sprintf(utils.color('pending', '%s %s%s'), mark, indent(unit.ctx.groups.length), unit.describe)
      }, 120);
    })

    emiter.on('doneUnit', function() {
      clearSpinner();
      let unit = current;
      let fmt;
      let speed = utils.speed(unit.session.duration, options.slow);
      if (speed === 'fast') {
        fmt =
          indent(unit.ctx.groups.length) +
          utils.color('okmark', utils.symbols.ok) +
          utils.color('pass', '  %s');
        utils.print(fmt, unit.describe);
      } else {
        fmt =
          indent(unit.ctx.groups.length) +
          utils.color('okmark', utils.symbols.ok) +
          utils.color('pass', '  %s') +
          utils.color(speed, ' (%dms)');
        utils.print(fmt, unit.describe, unit.session.duration);
      }
    });

    emiter.on('errorUnit', function(err) {
      clearSpinner();
      utils.print(indent() + utils.color('fail', '%d) %s'), ++counterr, current.describe);
    });

    emiter.on('done', function(args) {
      clearSpinner();
      utils.epilogue(args);
    });
  };
};

function indent(n = 0) {
  return Array(n + 1).join('  ');
}