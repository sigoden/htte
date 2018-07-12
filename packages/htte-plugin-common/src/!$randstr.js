module.exports = function(options) {
  return {
    tag: '!$randstr',
    kind: 'scalar',
    handler: function(context, literal) {
      try {
        let [length, flag] = parseOptions(literal);
        return randomString(length, flag);
      } catch (err) {
        return context.throw(err.message);
      }
    }
  };
};

function parseOptions(literal) {
  if (literal === null) return [6, 'lun'];
  if (!/^(\d+)?:?[lun]{0,3}$/.test(literal)) {
    throw new Error(`arguments invalid, ${literal}`);
  }
  let [length, flag = 'lun'] = literal.split(':');
  length = parseInt(length || 6);
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
