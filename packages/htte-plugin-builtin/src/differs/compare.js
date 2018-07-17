const numeral = require('numeral');

const OP = {
  lt: function(v1, v2) {
    return v1 < v2;
  },
  lte: function(v1, v2) {
    return v1 <= v2;
  },
  gt: function(v1, v2) {
    return v1 > v2;
  },
  gte: function(v1, v2) {
    return v1 >= v2;
  },
  eq: function(v1, v2) {
    return v1 == v2;
  },
  ne: function(v1, v2) {
    return v1 != v2;
  }
};

module.exports = function(options) {
  return {
    name: 'compare',
    kind: 'mapping',
    diff: function(context, literal, actual) {
      if (literal === null) context.throw('literal cannot be null');
      let fn = OP[literal.op];
      if (!fn) context.throw('literal {op} is not supported');
      if (!diffNumber(context, literal.value, actual, fn)) {
        context.throw(`actual dont ${literal.op} literal`);
      }
    }
  };
};

function diffNumber(context, literal, actual, fn) {
  let numLiteral = numeral(literal).value();
  if (numLiteral === null) {
    context.throw('literal value cannot convert to number');
  }
  let numActual = numeral(actual).value();
  if (numActual === null) {
    context.throw('actual value cannot convert to number');
  }
  return fn(numActual, numLiteral);
}
