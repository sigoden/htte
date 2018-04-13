module.exports = {
  name: 'q',
  kind: 'scalar',
  type: 'resolver',
  handler: (context, literal) => {
    let value = context.query(literal)
    if (typeof value === 'undefined') {
      return context.error(`cannot find variable ${literal}`)
    }
    return value
  }
}
