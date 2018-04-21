/**
 * Regexpp differ diff the target match the regexp
 */
module.exports = {
  name: 'regexp',
  kind: 'scalar',
  handler: (context, literal, actual) => {
    if (typeof actual !== 'string') {
      return context.error('target must be string')
    }
    let re = parseRegexp(literal)
    if (re.test(actual)) {
      return true
    }
    return context.error(`do not match regexp ${re}`)
  }
}

function parseRegexp(data) {
  let regexp = data
  let tail = /\/([gim]*)$/.exec(data)
  let modifiers = ''

  if (regexp[0] === '/') {
    if (tail) modifiers = tail[1]
    regexp = regexp.slice(1, regexp.length - modifiers.length - 1)
  }

  return new RegExp(regexp, modifiers)
}
