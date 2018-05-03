/**
 * Or differ is compound differ, each element is independent differ, if any passes, then the differ
 * passes
 *
 * e.g.
 *
 * value: !@or
 *  - !@object
 *    a: !@exist
 *  - !@object
 *    b: !@exist
 *
 * { a: 3, b: 4 } ✓
 * { a: 3 } ✓
 * { b: 4 } ✓
 * {} ✗
 */
module.exports = {
  name: 'or',
  kind: 'sequence',
  handler: (context, literal, actual) => {
    if (!Array.isArray(literal)) {
      return context.error('yaml tag arguments must be array')
    }
    let pass = literal.some(item => context.diff(context, item, actual))
    if (pass) context.clearLog()
    return pass
  }
}
