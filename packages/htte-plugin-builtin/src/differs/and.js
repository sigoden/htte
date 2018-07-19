module.exports = function(options) {
  return {
    name: 'and',
    kind: 'sequence',
    diff: function(context, literal, actual) {
      if (literal === null) context.throw('literal cannot be null');
      literal.forEach(function(item) {
        context.diff(item, actual);
      });
    }
  };
};
