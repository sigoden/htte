/**
 * Concat resolver concat the array
 */
module.exports = {
  name: 'concat',
  kind: 'sequence',
  handler: (context, literal) => {
    if (!Array.isArray(literal)) {
      return context.error('arguments must be array')
    }
    return literal.join('')
  }
}
