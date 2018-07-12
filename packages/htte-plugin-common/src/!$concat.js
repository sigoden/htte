module.exports = function(options) {
  return {
    tag: '!$concat',
    kind: 'sequence',
    handler: function(context, literal) {
      if (!Array.isArray(literal)) {
        context.throw('value must be array');
      }
      return literal.join('');
    }
  };
};
