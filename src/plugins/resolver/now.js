module.exports = {
  name: 'now',
  kind: 'scalar',
  type: 'resolver',
  handler: (context, literal) => {
    if (literal === null) {
      return new Date()
    }

    let value = context.query(literal)

    let offset = parseInt(value)
    if (Number.isNaN(offset)) {
      return context.log(`arg should be a number reperset miliseconds`)
    }
    return new Date(Date.now() + offset)
  }
}
