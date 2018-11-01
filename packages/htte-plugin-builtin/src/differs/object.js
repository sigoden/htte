module.exports = function(options) {
  return {
    name: 'object',
    kind: 'mapping',
    diff: function(context, literal, actual) {
      if (literal === null) context.throw('literal cannot be null');
      if (!isObject(actual)) context.throw('actual value must be object');
      const { required, optional } = splitObj(literal);
      context.diff(required, actual, false);
      const existedOptional = {};
      Object.keys(optional).forEach(key => {
        if (actual[key]) {
          existedOptional[key] = optional[key];
          return;
        }
        const noqKey = key.slice(0, -1);
        if (actual[noqKey]) {
          existedOptional[noqKey] = optional[key];
        }
      });
      context.diff(existedOptional, actual, false);
    }
  };
};

function isObject(o) {
  return typeof o === 'object' && Object.prototype.toString.call(o) === '[object Object]';
}

function splitObj(obj) {
  const required = {};
  const optional = {};
  Object.keys(obj).forEach(key => {
    if (/\?$/.test(key)) {
      optional[key] = obj[key];
    } else {
      required[key] = obj[key];
    }
  });
  return { required, optional };
}
