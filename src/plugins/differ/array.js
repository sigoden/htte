module.exports = {
  name: 'array',
  kind: 'mapping',
  type: 'differ',
  handler: (context, literal, actual) => {
    if (!Array.isArray(actual)) {
      return context.error('actual must be array')
    }
    let object = {}
    for (let index of actual) {
      object[index] = actual.index
    }
    object.length = actual.length
    return context.diff(context, object, actual, false)
  }
}
