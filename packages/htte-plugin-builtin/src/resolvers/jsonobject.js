module.exports = function(options) {
  return {
    name: 'jsonobject',
    kind: 'mapping',
    resolve: function(context, literal) {
      return JSON.stringify(literal);
    }
  };
};
