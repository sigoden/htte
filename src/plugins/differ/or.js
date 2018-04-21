/**
 * Or differ is compound differ, each element is a independent differ, if they any of them pass, then and differ
 * is pass
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
