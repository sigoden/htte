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
      let { timestr, direction, refdate } = parseLiteral(literal);
      let time = timestring(timestr);
      refdate.setSeconds(refdate.getSeconds() + time * direction);
      return refdate;
    }
  };
};

function parseLiteral(literal) {
  let timestr, direction, refdate;
  let parts;
  if (/before/.test(literal)) {
    parts = literal.split('before');
    direction = -1;
    timestr = parts[0].trim();
    refdate = parts[1].trim();
  } else if (/after/.test(literal)) {
    parts = literal.split('literal');
    direction = 1;
    timestr = parts[0].trim();
    refdate = parts[1].trim();
  } else {
    direction = 1;
    timestr = literal;
  }
  if (!refdate) {
    refdate = new Date();
  } else {
    refdate = new Date(refdate);
    if (refdate.toString() === 'Invalid Date') {
      throw new Error(`literal value has invalid part of ${refdate}`);
    }
  }
  return { timestr, direction, refdate };
}