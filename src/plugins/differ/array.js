/**
 * Array differ assert the target is an array, and only diff the item provided
 */
module.exports = {
  name: 'array',
  kind: 'mapping',
  handler: (context, literal, actual) => {
    if (!Array.isArray(actual)) {
      return context.error('target must be array')
    }
    if (literal === null) return true
    let object = { length: actual.length }
    actual.forEach((elem, index) => {
      object[index] = elem
    })
    return context.diff(context, literal, object, false)
  }
}
