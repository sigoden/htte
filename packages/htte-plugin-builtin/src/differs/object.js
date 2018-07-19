module.exports = function(options) {
  return {
    name: 'object',
    kind: 'mapping',
    diff: function(context, literal, actual) {
      if (literal === null) context.throw('literal cannot be null');
      if (!isObject(actual)) context.throw('actual value must be object');
      context.diff(literal, actual, false);
    }
  };
};

function isObject(o) {
  return typeof o === 'object' && Object.prototype.toString.call(o) === '[object Object]';
}
