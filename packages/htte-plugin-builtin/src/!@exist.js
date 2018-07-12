module.exports = function(options) {
  return {
    tag: '!@exist',
    kind: 'scalar',
    handler: function(context, literal, actual) {
      if (actual !== undefined) return true;
      return context.throw('property dont exist');
    }
  };
};
