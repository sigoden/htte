const utils = require('./utils');
const defaultOptions = {
  slow: 1000
};

module.exports = function(htte, options = {}) {
  options = Object.assign(defaultOptions, options);
  return function({ emitter }) {
    let clearSpinner;
    let current;
    let counterr = 0;
    let tdd = false;

    emitter.on('start', function(args) {
      tdd = !!args.tdd;
      utils.print();
    });

    emitter.on('enterGroup', function(args) {
      let { unit } = args;
      const { groups, enterGroupLevel = groups.length } = unit.ctx;
      const startIndex = groups.length - enterGroupLevel;
      groups.forEach(function(group, index) {
        if (index >= startIndex) {
          utils.print(utils.color('title', '%s%s'), indent(index), group);
        }
      });
    });

    emitter.on('skipUnit', function(args) {
      let { unit } = args;
      utils.print(utils.color('skip', '%s%s  %s'), indent(unit.ctx.groups.length), utils.symbols.dot, unit.describe);
    });

    emitter.on('runUnit', function(args) {
      let { unit } = args;
      current = unit;
      if (!process.env.HTTE_CI_MODE) {
        clearSpinner = utils.spinner(function(mark) {
          return utils.sprintf(utils.color('pending', '%s%s  %s'), indent(unit.ctx.groups.length), mark, unit.describe);
        }, utils.spinnerInterval || 30);
      }
    });

    emitter.on('doneUnit', function() {
      if (clearSpinner) clearSpinner();
      let unit = current;
      let fmt;
      let speed = utils.speed(unit.session.duration, options.slow);
      if (speed === 'fast') {
        fmt = indent(unit.ctx.groups.length) + utils.color('okmark', utils.symbols.ok) + utils.color('pass', '  %s');
        utils.print(fmt, unit.describe);
      } else {
        fmt =
          indent(unit.ctx.groups.length) +
          utils.color('okmark', utils.symbols.ok) +
          utils.color('pass', '  %s') +
          utils.color(speed, ' (%s)');
        utils.print(fmt, unit.describe, utils.ms(unit.session.duration));
      }
    });

    emitter.on('errorUnit', function(err) {
      if (clearSpinner) clearSpinner();
      if (tdd || !!process.env.HTTE_CI_MODE) current.metadata.debug = true;
      utils.print(indent(current.ctx.groups.length) + utils.color('fail', '%d) %s'), ++counterr, current.describe);
    });

    emitter.on('done', function(args) {
      if (clearSpinner) clearSpinner();
      utils.epilogue(args);
    });
  };
};

function indent(n = 0) {
  return Array(n + 1).join('  ');
}
