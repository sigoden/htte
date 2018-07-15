const { diffNumber } = require('../utils/diff-number');

module.exports = function(options) {
  return {
    name: 'gte',
    kind: 'scalar',
    diff: function(context, literal, actual) {
      let fn = function(v1, v2) { return v1 >= v2 }
      if (!diffNumber(context, literal, actual, fn)) {
        context.throw('literal do not gte actual');
      }
    }
  };
};
