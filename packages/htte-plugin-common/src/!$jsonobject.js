module.exports = function(options) {
  return {
    tag: '!$jsonobject',
    kind: 'mapping',
    handler: function(context, literal) {
      return JSON.stringify(literal);
    }
  };
};
