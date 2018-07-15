module.exports = function(options) {
  return {
    name: 'jsonobject',
    kind: 'sequence',
    resolve: function(context, literal) {
      return JSON.stringify(literal);
    }
  };
};
