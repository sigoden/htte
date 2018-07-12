const timestring = require('timestring');
const dateFormat = require('dateformat');

module.exports = function(options) {
  return {
    tag: '!$datetime',
    kind: 'sequence',
    handler: function(context, literal) {
      let offset, format, refDate;
      try {
        [offset, format, refDate] = parseLiteral(literal);
      } catch (err) {
        context.throw(err.message);
      }
      refDate.setTime(refDate.getTime() + offset);
      if (!format) {
        return refDate.toISOString();
      }
      let result = dateFormat(refDate, format);
      if (result === format) context.throw(`format ${format} options is invalid`);
      return result;
    }
  };
};

function parseLiteral(literal) {
  let offset, format, refDate;
  if (literal === null) {
    offset = 0;
    refDate = new Date();
  } else if (Array.isArray(literal)) {
    let [optionsArg, refDateArg] = literal;
    [offset, format] = parseOptions(optionsArg);
    try {
      refDate = toDate(refDateArg);
    } catch (err) {
      throw new Error(`arguments of refDate invalid`);
    }
  } else {
    throw new Error('arguments must be array');
  }
  return [offset, format, refDate];
}

function parseOptions(options) {
  if (!options) {
    return [0];
  }
  options = String(options);
  let haveMinus = false;
  if (options.startsWith('- ')) {
    options = options.slice(2);
    haveMinus = true;
  }
  let [offsetString, format] = options.split(':');
  let offset = timestring(offsetString) * 1000;
  offset = haveMinus ? -1 * offset : offset;
  return [offset, format];
}

function toDate(value) {
  let date = new Date();
  if (!value) return date;
  value = String(value);
  let time;
  if (/^\d+(\.)?\d+$/.test(value)) {
    time = parseFloat(value);
  } else {
    time = Date.parse(value);
    if (Number.isNaN(time)) {
      throw new Error('Date.parse');
    }
  }
  date.setTime(time);
  return date;
}
