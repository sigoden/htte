module.exports = function(options) {
  return {
    tag: '!@object',
    kind: 'mapping',
    handler: function(context, literal, actual) {
      if (!isObject(actual)) context.throw('target must be object');
      if (literal === null) return;
      context.diff(literal, actual, false);
    }
  };
};

function isObject(o) {
  return typeof o === 'object' && Object.prototype.toString.call(o) === '[object Object]';
}
