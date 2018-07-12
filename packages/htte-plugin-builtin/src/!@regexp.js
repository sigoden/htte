module.exports = function(options) {
  return {
    tag: '!@regexp',
    kind: 'scalar',
    handler: function(context, literal, actual) {
      if (typeof actual !== 'string') {
        context.throw('target must be string');
      }
      let re = parseRegexp(literal);
      if (!re.test(actual)) {
        context.throw(`do not match regexp ${re}`);
      }
    }
  };
};

function parseRegexp(data) {
  let regexp = data;
  let tail = /\/([gim]*)$/.exec(data);
  let modifiers = '';

  if (regexp[0] === '/') {
    if (tail) modifiers = tail[1];
    regexp = regexp.slice(1, regexp.length - modifiers.length - 1);
  }

  return new RegExp(regexp, modifiers);
}
