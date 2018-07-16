const render = require('./render');
module.exports = function(htte, options = {}) {
  return function({ emitter }) {
    let data = {};
    emitter.on('start', function({ units }) {
      data.units = units;
      data.startedAt = new Date();
    });
    emitter.on('done', function() {
      data.stopedAt = new Date();
      render(data);
    });
  };
};
