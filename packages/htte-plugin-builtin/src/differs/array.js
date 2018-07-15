module.exports = function(options) {
  return {
    name: 'array',
    kind: 'sequence',
    diff: function(context, literal, actual) {
      if (!Array.isArray(literal)) return;
      if (!Array.isArray(actual)) context.throw('actual value must be array');
      literal.forEach(function(itemLiteral, index) {
        for (let itemActual of actual) {
          try {
            context.enter(index).diff(itemActual, itemLiteral);
            break;
          } catch (err) {
            continue;
          }
          context.throw('none actual match the literal');
        }
      });
    }
  };
};
