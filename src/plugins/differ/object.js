/**
 * Object differ asserts the target is object, and specific properties match
 *
 * e.g.
 *
 * value: !@object
 *  a: 3
 *
 * { a: 3, b: 4 }  ✓
 * { a: 3 }  ✓
 * {}  ✗
 */
module.exports = {
  name: 'object',
  kind: 'mapping',
  handler: (context, literal, actual) => {
    if (!isObject(actual)) return context.error('target must be object')
    if (literal === null) return true
    return context.diff(context, literal, actual, false)
  }
}

function isObject(o) {
  return typeof o === 'object' && Object.prototype.toString.call(o) === '[object Object]'
}
