module.exports = function(options) {
  return {
    name: 'trycatch',
    kind: 'mapping',
    diff: function(context, literal, actual) {
      if (literal === null) context.throw('literal cannot be null');
      if (literal.try === undefined || literal.catch === undefined) context.throw('literval {try,catch} is invalid');
      try {
        context.diff(literal.try, actual);
      } catch (err) {
        context.diff(literal.catch, `${err.parts.join('->')}: ${err.message}`);
      }
    }
  };
};
