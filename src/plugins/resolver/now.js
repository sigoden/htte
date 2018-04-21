/**
 * Generate current datetime string
 */
module.exports = {
  name: 'now',
  kind: 'scalar',
  handler: (context, literal) => {
    let offset
    if (literal === null) {
      offset = 0
    } else {
      offset = parseInt(literal)
      if (Number.isNaN(offset)) {
        return context.error('argument offset must be integer')
      }
    }
    let date = new Date()
    date.setTime(date.getTime() + offset)
    return date.toISOString()
  }
}
