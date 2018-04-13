module.exports = {
  name: 'object',
  kind: 'mapping',
  type: 'differ',
  handler: (context, literal, actual) => {
    return context.diff(context, literal, actual, false)
  }
}
