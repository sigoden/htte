/**
 * Generate random string
 * @argument {Integer} length - length of random string
 *
 * e.g.
 *
 * !$randstr
 * 8asVsd
 *
 * !$randstr
 * Adsf7v
 *
 * !$randstr 8
 * bnYdsf7s
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
