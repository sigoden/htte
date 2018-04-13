module.exports = {
  name: 'x',
  kind: 'scalar',
  type: 'differ',
  handler: (context, literal, actual) => {
    if (literal === null) {
      if (typeof actual === 'undefined') {
        return context.error(`no such field`)
      }
      return true
    }

    if (typeof actual === literal) {
      return true
    }

    return context.error(`expect type: ${literal}, got ${typeof actual}`)
  }
}
