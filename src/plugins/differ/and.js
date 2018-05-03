/**
 * And differ is compound differ, each element is independent differ. if all pass, then the differ
 * passes, otherwise the differ fails
 *
 * e.g.
 *
 * value: !@and
 *   - !@object
 *     a: !exist
 *   - !@object
 *     b: !exist
 *
 * { a: '', b: '' } ✓
 * { a: '' } ✗
 * { b: '' } ✗
 */
module.exports = {
  name: 'and',
  kind: 'sequence',
  handler: (context, literal, actual) => {
    if (!Array.isArray(literal)) {
      return context.error('arguments must be array')
    }
    return literal.every(item => context.diff(context, item, actual))
  }
}
