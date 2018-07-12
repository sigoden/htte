module.exports = function(options) {
  return {
    tag: '!@and',
    kind: 'sequence',
    handler: function(context, literal, actual) {
      if (!Array.isArray(literal)) context.throw('value must be array');
      literal.forEach(function(item) {
        context.diff(item, actual);
      });
    }
  };
};
