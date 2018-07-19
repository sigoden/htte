const numeral = require('numeral');

const TYPE = {
  string: function(v) {
    return JSON.stringify(v);
  },
  number: function(v) {
    let num = numeral(v).value();
    if (num === null) {
      throw new Error('literal can not convert to number');
    }
    return num;
  },
  boolean: function(v) {
    return Boolean(v);
  },
  integer: function(v) {
    let num = numeral(v).value();
    if (num === null) {
      throw new Error('literal can not convert to integer');
    }
    return Math.round(num);
  },
  array: function(v) {
    return [v];
  }
};

module.exports = function(options) {
  return {
    name: 'convert',
    kind: 'mapping',
    resolve: function(context, literal) {
      if (literal === null) return;
      let fn = TYPE[literal.to];
      if (!fn) context.throw('literal {to} is not supported');
      return fn(literal.value);
    }
  };
};
