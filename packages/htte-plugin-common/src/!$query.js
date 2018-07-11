module.exports = function (options) {
  return {
    tag: '!$query',
    kind: 'scalar',
    handler: (context, literal) => {
      let value;
      try {
        value = context.query(literal);
      } catch (err) {
        context.log(err.message);
        return;
      }
      return value[0];
    }
  }
};
