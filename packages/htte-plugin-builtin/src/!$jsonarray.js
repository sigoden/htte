module.exports = function(options) {
  return {
    tag: '!$jsonobject',
    kind: 'sequence',
    handler: function(context, literal) {
      return JSON.stringify(literal);
    }
  };
};
