module.exports = function(options) {
  return {
    name: 'array',
    kind: 'sequence',
    diff: function(context, literal, actual) {
      if (!Array.isArray(literal)) return;
      if (!Array.isArray(actual)) context.throw('actual value must be array');
      literal.forEach(function(itemLiteral, index) {
        let found = false;
        for (let itemActual of actual) {
          try {
            context.enter(index).diff(itemLiteral, itemActual);
            found = true;
            break;
          } catch (err) {}
        }
        if (!found) context.throw(`${index + 1}th element dont exist`);
      });
    }
  };
};
