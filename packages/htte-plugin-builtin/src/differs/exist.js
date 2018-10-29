module.exports = function(options) {
  return {
    name: 'exist',
    kind: 'scalar',
    diff: function(context, literal, actual) {
      if (typeof literal !== 'string' && typeof literal !== 'null') {
        context.throw('literal value must be string if exists');
      }
      if (actual === undefined) context.throw('actual value does not exist');
      const shouldCheckType = literal !== '' && literal !== null;
      if (!shouldCheckType) return;
      if (typeof actual !== literal) {
        if (Array.isArray(actual) && literal === 'array') return;
        if (actual === null && literal === 'null') return;
        context.throw(`actual value is not ${literal}`);
      }
    }
  };
};
