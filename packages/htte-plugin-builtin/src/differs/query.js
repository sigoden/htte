module.exports = function(options) {
  return {
    name: 'query',
    kind: 'scalar',
    diff: function(context, literal, actual) {
      let value = context.query(literal);
      return context.diff(value, actual);
    }
  };
};
