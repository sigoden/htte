const numeral = require('numeral')

module.exports = function(options) {
  return {
    name: 'tointeger',
    kind: 'scalar',
    resolve: function(context, literal) {
      let value = numeral(literal).value();
      if (value === null) {
        context.throw('literal value cannot convert to integer');
      }
      return Math.round(value);
    }
  };
};
