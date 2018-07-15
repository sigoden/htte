module.exports = function(options) {
  return {
    name: 'range',
    kind: 'sequence',
    diff: function(context, literal, actual) {
      if (!Array.isArray(literal)) return true;
      let [min, max, ref = 0] = literal;
      min = Number(min);
      max = Number(max);
      ref = Number(ref);
      if (Number.isNaN(min) || Number.isNaN(max) || Number.isNaN(ref)) {
        context.throw('literal value [min,max,ref] must be number');
      }
      let value = actual - ref;
      if (value >= min && value < max) return true;
      context.throw('actual value do not match range');
    }
  };
};
