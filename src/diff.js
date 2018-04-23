const _ = require('lodash')
const utils = require('./utils')

function diff(context, expect, actual, isStrict = true) {
  switch (utils.type(expect)) {
    case 'number':
    case 'boolean':
    case 'string':
    case 'null':
    case 'undefined':
      return diffPrimitive(context, expect, actual)
    case 'function':
      try {
        return expect(context, actual)
      } catch (err) {
        return context.error(`cannot diff, ${err}`)
      }
    case 'array':
      return diffArray(context, expect, actual, isStrict)
    default:
      return diffObject(context, expect, actual, isStrict)
  }
}

function diffPrimitive(context, expect, actual) {
  if (_.isEqual(expect, actual)) return true
  return context.error(`value diff, expect ${JSON.stringify(expect)}, actual ${JSON.stringify(actual)}`)
}

function diffArray(context, expect, actual, isStrict) {
  if (!diffType(context, expect, actual)) return false
  let sameLength = expect.length === actual.length
  if (isStrict && !sameLength) {
    return context.error(`element diff, expect ${expect.length}, actual ${actual.length}`)
  }
  return expect.every((elem, index) => {
    return diff(context.enter(`[${index}]`), elem, actual[index])
  })
}

function diffType(context, expect, actual) {
  if (utils.isTypeOf(expect, utils.type(actual))) return true

  return context.error(`type diff, expect ${JSON.stringify(expect)}, actual ${JSON.stringify(actual)}`)
}

function diffObject(context, expect, actual, isStrict) {
  if (!diffType(context, expect, actual)) {
    return false
  }
  let expectKeys = Object.keys(expect)
  let actualKeys = Object.keys(actual)

  if (isStrict && !satifyObjectKeys(context, expectKeys, actualKeys)) {
    return false
  }

  return expectKeys.every(key => {
    let _expect = expect[key]
    let _actual = actual[key]
    return diff(context.enter(key), _expect, _actual)
  })
}

function satifyObjectKeys(context, expect, actual) {
  let excludes = _.difference(expect, actual)
  let includes = _.difference(actual, expect)

  let errMsg = ``
  if (excludes.length) {
    errMsg += `, missed ${excludes.join('|')}`
  }
  if (includes.length) {
    errMsg += `, extra ${includes.join('|')}`
  }

  if (!errMsg) {
    return true
  }

  errMsg = `props diff` + errMsg
  context.error(errMsg)
  return false
}

module.exports = diff
