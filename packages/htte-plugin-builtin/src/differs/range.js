module.exports = function(options) {
  return {
    name: 'range',
    kind: 'sequence',
    diff: function(context, literal, actual) {
      if (!Array.isArray(literal)) context.throw('literal cannot be null');
      let [min, max, basis = 0] = literal;
      min = Number(min);
      max = Number(max);
      basis = Number(basis);
      if (Number.isNaN(min) || Number.isNaN(max) || Number.isNaN(basis)) {
        context.throw('literal value [min,max,basis] must be number');
      }
      let value = actual - basis;
      if (value >= min && value < max) return true;
      context.throw('actual value do not match range');
    }
  };
};
