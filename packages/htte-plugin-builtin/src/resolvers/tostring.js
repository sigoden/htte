module.exports = function(options) {
  return {
    name: 'tostring',
    kind: 'scalar',
    resolve: function(context, literal) {
      return String(literal);
    }
  };
};
