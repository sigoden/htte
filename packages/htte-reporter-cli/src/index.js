const util = require('util');

module.exports = function(htte, options) {
  let current;
  return function(emiter) {
    emiter.on('start', function(args) {
      console.log('start');
    });
    emiter.on('enterGroup', function(args) {
      let { unit } = args;
      console.log(`enter group: ${unit.ctx.groups}`);
    });
    emiter.on('skipUnit', function(args) {
      let { unit } = args;
      console.log(`skip unit: ${unit.name}`);
    });
    emiter.on('runUnit', function(args) {
      let { unit } = args;
      current = unit;
      console.log(`run unit: ${unit.name}`);
    });
    emiter.on('doneUnit', function() {
      console.log(`done unit`);
    });
    emiter.on('errorUnit', function(err) {
      console.log(err);
      console.log(util.inspect(current.session, { depth: 6 }));
    });
    emiter.on('done', function() {
      console.log('done');
    });
  };
};
