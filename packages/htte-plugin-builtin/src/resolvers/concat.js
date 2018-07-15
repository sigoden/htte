module.exports = function(options) {
  return {
    name: 'concat',
    kind: 'sequence',
    resolve: function(context, literal) {
      if (!Array.isArray(literal)) return ''
      return literal.join('');
    }
  };
};
