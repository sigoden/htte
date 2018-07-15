module.exports = function(options) {
  return {
    name: 'query',
    kind: 'scalar',
    resolve: function(context, literal) {
      let value;
      try {
        value = context.query(literal);
      } catch (err) {
        context.throw(err.message);
      }
      return value;
    }
  };
};
