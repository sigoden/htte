const timestring = require('timestring');

module.exports = function(options) {
  return {
    name: 'time',
    kind: 'scalar',
    resolve: function(context, literal) {
      if (typeof literal !== 'string') {
        context.throw('literal value must be string');
      }
      let { timestr, direction, refdate } = parseLiteral(literal);
      let date = parseReftime(refdate);
      let time = timestring(timestr);
      date.setSeconds(date.getSeconds() + time * direction);
      return date;
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
  return { timestr, direction, refdate };
}

function parseReftime(refdate) {
  try {
    return new Date(refdate);
  } catch (err) {
    throw new Error(`literal value has invalid part${refdate}`);
  }
}
