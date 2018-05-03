/**
 * Current datetime in string
 *
 * @argument {Integer} offset - offset current time in millisecond
 *
 * e.g.
 *
 * !$now
 * 2018-05-02T03:03:06.330Z
 *
 * !$now 86400000
 * 2018-05-03T03:03:06.330Z
 *
 * !$now -86400000
 * 2018-05-01T03:03:06.330Z
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
