/**
 * Query differ get the variable value then diff the value with the target
 */
module.exports = {
  name: 'query',
  kind: 'scalar',
  handler: (context, literal, actual) => {
    let value = context.query(literal)
    if (value === undefined) {
      return context.error(`cannot find variable at ${literal}`)
    }
    return context.diff(context, value, actual)
  }
}
