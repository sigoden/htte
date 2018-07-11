module.exports = function (options) {
  return function (emiter) {
    emiter.on('enterGroup', function (args) {
      let { units } = args;
      console.log(`enter group: ${units.ctx.groups}`);
    });
    emiter.on('skipUnit', function (args) {
      let { units } = args;
      console.log(`skip unit: ${units.name}`);
    });
    emiter.on('runUnit', function (args) {
      let { units } = args;
      console.log(`run unit: ${units.name}`);
    });
    emiter.on('debugUnit', function (args) {
      let { units } = args;
      console.log(`debug unit: ${units.name}`);
    });
    emiter.on('doneUnit', function (args) {
      let { units } = args;
      console.log(`done unit: ${units.name}`);
    });
    emiter.on('error', function (err) {
      console.log(err);
    });
    emiter.on('stop', function (args) {
      console.log('stop');
    });
    emiter.on('done', function (args) {
      console.log('done');
    });
  }
}