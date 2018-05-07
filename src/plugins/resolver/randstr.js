/**
 * Generate random string
 * @argument {string} options - <length>:<flag>
 * flag l -> a-z, u -> A-Z, n -> 0-9, lu -> a-zA-Z, lun -> a-zA-Z0-9
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
 *
 * !$randstr 8:lu
 * bnYdsfbs
 */
module.exports = {
  name: 'randstr',
  kind: 'scalar',
  handler: (context, literal) => {
    try {
      let [length, flag] = parseOptions(literal)
      return randomString(length, flag)
    } catch (err) {
      return context.error(err.message)
    }
  }
}

function parseOptions(literal) {
  if (literal === null) return [6, 'lun']
  if (!/^(\d+)?:?[lun]{0,3}$/.test(literal)) {
    throw new Error(`arguments invalid, ${literal}`)
  }
  let [length, flag = 'lun'] = literal.split(':')
  length = parseInt(length || 6)
  return [length, flag]
}

function randomString(length, flag) {
  let result = ''
  let possible = ''
  if (flag.indexOf('l') > -1) {
    possible += 'abcdefghijklmnopqrstuvwxyz'
  }
  if (flag.indexOf('u') > -1) {
    possible += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  }
  if (flag.indexOf('n') > -1) {
    possible += '0123456789'
  }
  for (let i = 0; i < length; i++) {
    result += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return result
}
