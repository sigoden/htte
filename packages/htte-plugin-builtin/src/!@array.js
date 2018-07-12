module.exports = function(options) {
  return {
    tag: '!@array',
    kind: 'mapping',
    handler: function(context, literal, actual) {
      if (!Array.isArray(actual)) context.throw('target must be array');
      if (literal === null) return true;
      let object = { length: actual.length };
      actual.forEach(function(elem, index) {
        object[index] = elem;
      });
      context.diff(literal, object, false);
    }
  };
};
