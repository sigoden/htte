/**
 * Exist differ assert the field exist
 */
module.exports = {
  name: 'exist',
  kind: 'scalar',
  handler: (context, literal, actual) => {
    if (actual !== undefined) return true
    return context.error('property do not exist')
  }
}
