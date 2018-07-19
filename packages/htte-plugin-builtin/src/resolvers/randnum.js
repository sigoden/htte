module.exports = function(options) {
  return {
    name: 'randnum',
    kind: 'sequence',
    resolve: function(context, literal) {
      if (!Array.isArray(literal)) return 0;
      let [min, max] = literal;
      min = Number(min);
      max = Number(max);
      if (Number.isNaN(min) || Number.isNaN(max)) {
        context.throw('literal value [min,max] must be number');
      }
      return Math.random() * (max - min) + min;
    }
  };
};
