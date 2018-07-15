module.exports = function(options) {
  return {
    name: 'object',
    kind: 'mapping',
    diff: function(context, literal, actual) {
      if (!isObject(actual)) context.throw('actual value must be object');
      if (literal === null) return;
      context.diff(literal, actual, false);
    }
  };
};

function isObject(o) {
  return typeof o === 'object' && Object.prototype.toString.call(o) === '[object Object]';
}
