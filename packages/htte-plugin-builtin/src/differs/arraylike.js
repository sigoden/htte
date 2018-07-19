module.exports = function(options) {
  return {
    name: 'arraylike',
    kind: 'mapping',
    diff: function(context, literal, actual) {
      if (literal === null) context.throw('literal cannot be null');
      if (!Array.isArray(actual)) context.throw('actual must be array');
      let obj = { length: actual.length };
      actual.reduce(function(obj, item, index) {
        obj[index] = item;
        return obj;
      }, obj);
      context.diff(literal, obj, false);
    }
  };
};

function isObject(o) {
  return typeof o === 'object' && Object.prototype.toString.call(o) === '[object Object]';
}
