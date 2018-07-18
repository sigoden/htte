module.exports = function(options) {
  return {
    name: 'randstr',
    kind: 'scalar',
    resolve: function(context, literal) {
      try {
        let [length, flag] = parseLiteral(literal);
        return randomString(length, flag);
      } catch (err) {
        return context.throw(err.message);
      }
    }
  };
};

function parseLiteral(literal) {
  if (literal === null) return [6, 'lun'];
  if (!/^(\d+)?:?[lun]{0,3}$/.test(literal)) {
    throw new Error(`literal value must match patttern (?<length>[\d+])(:?<flag>[lun]+])?`);
  }
  let [length, flag = 'lun'] = literal.split(':');
  length = parseInt(length || randomLength(1, 62));
  return [length, flag];
}

function randomString(length, flag) {
  let result = '';
  let possible = '';
  if (flag.indexOf('l') > -1) {
    possible += 'abcdefghijklmnopqrstuvwxyz';
  }
  if (flag.indexOf('u') > -1) {
    possible += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  }
  if (flag.indexOf('n') > -1) {
    possible += '0123456789';
  }
  for (let i = 0; i < length; i++) {
    result += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return result;
}

function randomLength(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}
