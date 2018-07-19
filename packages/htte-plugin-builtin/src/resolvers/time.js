const timestring = require('timestring');

module.exports = function(options) {
  return {
    name: 'time',
    kind: 'scalar',
    resolve: function(context, literal) {
      if (literal === null) {
        literal = '0';
      } else if (typeof literal === 'number') {
        literal = String(literal);
      } else if (typeof literal !== 'string') {
        context.throw('literal value must be string');
      }
      let { timestr, direction, basis } = parseLiteral(literal);
      let time = timestring(timestr);
      basis.setSeconds(basis.getSeconds() + time * direction);
      return basis;
    }
  };
};

function parseLiteral(literal) {
  let timestr, direction, basis;
  let parts;
  if (/before/.test(literal)) {
    parts = literal.split('before');
    direction = -1;
    timestr = parts[0].trim();
    basis = parts[1].trim();
  } else if (/after/.test(literal)) {
    parts = literal.split('literal');
    direction = 1;
    timestr = parts[0].trim();
    basis = parts[1].trim();
  } else {
    direction = 1;
    timestr = literal;
  }
  if (!basis) {
    basis = new Date();
  } else {
    basis = new Date(basis);
    if (basis.toString() === 'Invalid Date') {
      throw new Error(`literal value has invalid part of ${basis}`);
    }
  }
  return { timestr, direction, basis };
}
