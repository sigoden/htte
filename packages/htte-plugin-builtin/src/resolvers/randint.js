module.exports = function(options) {
  return {
    name: 'randint',
    kind: 'sequence',
    resolve: function(context, literal) {
      if (!Array.isArray(literal)) return 0;
      let [min, max] = literal;
      if (!Number.isInteger(min) || !Number.isInteger(max)) {
        context.throw('literal value [min,max] must be integer');
      }
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
  };
};
