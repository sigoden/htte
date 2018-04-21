module.exports = {
  name: 'query',
  kind: 'scalar',
  handler: (context, literal) => {
    let value = context.query(literal)
    if (value === undefined) {
      return context.error(`cannot find variable at ${literal}`)
    }
    return value
  }
}
