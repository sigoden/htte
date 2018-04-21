/**
 * And differ is compound differ, each element is a independent differ, if they all pass, then and differ
 * is pass, otherwise it will fail
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
