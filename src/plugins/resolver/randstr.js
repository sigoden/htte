/**
 * Generate random string
 */
module.exports = {
  name: 'randstr',
  kind: 'scalar',
  handler: (context, literal) => {
    let length
    if (literal === null) {
      length = 6
    } else {
      length = parseInt(literal)
      if (Number.isNaN(length)) {
        return context.error('argument length must be integer')
      }
    }
    return randomString(length)
  }
}

function randomString(length) {
  let result = ''
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < length; i++) {
    result += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return result
}
