const _ = require('lodash')
const utils = require('./utils')

/**
 * Diff the expect and the actual
 * @param {ContextDiff} context - the context to run diffing
 * @param {*} expect - the expect value
 * @param {*} actual - the actual value
 * @param {boolean} isStrict - whether enables strict mode
 *
 * @returns {boolean} - whether pass the diffing
 */
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
        return context.error(`cannot diff, ${err.message}`)
      }
    case 'array':
      return diffArray(context, expect, actual, isStrict)
    default:
      return diffObject(context, expect, actual, isStrict)
  }
}

/**
 * Diff the expect and the actual when the expect is primitive
 */
function diffPrimitive(context, expect, actual) {
  if (_.isEqual(expect, actual)) return true
  return context.error(`value diff, expect ${JSON.stringify(expect)}, actual ${JSON.stringify(actual)}`)
}

/*
 * Diff the expect and the actual when the expect is primitive
 */
function diffArray(context, expect, actual, isStrict) {
  if (!diffType(context, expect, actual)) return false
  let sameLength = expect.length === actual.length
  if (isStrict && !sameLength) {
    return context.error(`size diff, expect ${expect.length}, actual ${actual.length}`)
  }
  return expect.every((elem, index) => {
    return diff(context.enter(`[${index}]`), elem, actual[index])
  })
}

function diffType(context, expect, actual) {
  if (utils.isTypeOf(expect, utils.type(actual))) return true

  return context.error(`type diff, expect ${JSON.stringify(expect)}, actual ${JSON.stringify(actual)}`)
}

/*
 * Diff the expect and the actual when the expect is object
 */
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

/**
 * Wheter the expect and the actual have same properties
 */
function satifyObjectKeys(context, expect, actual) {
  let excludes = _.difference(expect, actual)
  let includes = _.difference(actual, expect)

  let errMsg = ``
  if (excludes.length) {
    errMsg += `, need ${excludes.join('|')}`
  }
  if (includes.length) {
    errMsg += `, extra ${includes.join('|')}`
  }

  if (!errMsg) {
    return true
  }

  return context.error(`props diff` + errMsg)
}

module.exports = diff
