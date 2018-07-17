module.exports = function(options) {
  return {
    name: 'arraylike',
    kind: 'sequence',
    resolve: function(context, literal) {
      if (!Array.isArray(literal)) context.throw('literal must be array');
      let result = { length: literal.length };
      return literal.reduce(function(obj, item, index) {
        obj[index] = item;
        return obj;
      }, result);
    }
  };
};
