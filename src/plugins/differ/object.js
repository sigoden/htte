/**
 * Object differ assert the target is object, and diff the property provided
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
