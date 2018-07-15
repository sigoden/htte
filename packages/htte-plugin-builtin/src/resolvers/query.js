module.exports = function(options) {
  return {
    name: 'query',
    kind: 'scalar',
    resolve: function(context, literal) {
      return context.query(literal);
    }
  };
};
