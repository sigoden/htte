module.exports = {
  name: 'q',
  kind: 'scalar',
  type: 'differ',
  handler: (context, literal, actual) => {
    let value = context.query(literal)
    if (typeof value === 'undefined') {
      return context.error(`cannot find variable at ${literal}`)
    }
    return context.diff(context, value, actual)
  }
}
