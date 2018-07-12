module.exports = function(options) {
  return {
    tag: '!@query',
    kind: 'scalar',
    handler: function(context, literal, actual) {
      let value = context.query(literal);
      return context.diff(value, actual);
    }
  };
};
