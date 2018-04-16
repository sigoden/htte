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
      return expect(context, actual)
    case 'array':
      return diffArray(context, expect, actual, isStrict)
    case 'object':
      return diffObject(context, expect, actual, isStrict)
    default:
      return context.error(`expect invalid: ${JSON.stringify(expect)}`)
  }
}

function diffPrimitive(context, expect, actual) {
  if (_.isEqual(expect, actual)) return true
  return context.error(`value different, expect: ${expect}, actual: ${actual}`)
}

function diffArray(context, expect, actual, isStrict) {
  if (!diffType(context, expect, actual)) return false
  let sameLength = expect.length === actual.length
  if (isStrict && !sameLength) {
    return context.error(`element different, expect: ${expect.length}, actual: ${actual.length}`)
  }
  return expect.every((elem, index) => {
    return diff(context.enter(`[${index}]`), item, actual[index])
  })
}

function diffType(context, expect, actual) {
  let typeExpect = typeof expect
  let typeActual = typeof actual
  if (typeExpect === typeActual) return true

  return context.error(`type different, expect: ${JSON.stringify(expect)}, actual: ${JSON.stringify(actual)}`)
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
    errMsg += `, miss props ${JSON.stringify(excludes)}`
  }
  if (includes.length) {
    errMsg += `, extra props ${JSON.stringify(includes)}`
  }

  if (!errMsg) {
    return true
  }

  errMsg = `property different` + errMsg
  context.error(errMsg)
  return false
}

module.exports = diff
