/**
 * Exist differ asserts the property of object exists
 *
 * e.g.
 *
 * value: !@object
 *   a: !@exist
 *
 * { a: true }  ✓
 * { a: 3 }  ✓
 * {} ✗
 */
module.exports = {
  name: 'exist',
  kind: 'scalar',
  handler: (context, literal, actual) => {
    if (actual !== undefined) return true
    return context.error('property do not exist')
  }
}
