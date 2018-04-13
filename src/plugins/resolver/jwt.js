module.exports = {
  name: 'jwt',
  kind: 'scalar',
  type: 'resolver',
  handler: (context, literal) => {
    let value = context.query(literal)
    if (typeof value === 'undefined') {
      return context.error(`cannot find variable at ${literal}`)
    }
    return `Bearer ${value}`
  }
}
