module.exports = function(options) {
  return {
    tag: '!$query',
    kind: 'scalar',
    handler: function(context, literal) {
      let value;
      try {
        value = context.query(literal);
      } catch (err) {
        context.throw(err.message);
      }
      return value[0];
    }
  };
};
