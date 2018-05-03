const jsonpath = require('jsonpath')
const utils = require('./utils')

const RE_VAR = /^\${1,4}/

/**
 * Create query function to query linked data
 *
 * @params {Object} unitsData - all units req and res data
 * @params {Object} configData - data from config
 * @params {Unit} unit
 *
 * linked-data query pattern:
 * - $auth.signup1.res.body.token - cross module (unitsData)
 * - $$signup1.res.body.token - current module (unitsData)
 * - $$$res.body.id - current unit (unitsData)
 * - $$$$a.b.c - everywhere (configData)
 *
 *
 * @returns {function}
 */
module.exports = function createQuery(unitsData, configData, unit) {
  let currentData = selectUnitsData(unitsData, unit)

  return (value, single = true) => {
    if (!isLink(value)) return value
    let jPath = toJPath(value, unit)
    let data
    if (isLinkConfigData(value)) {
      data = configData
    } else {
      let module = unit.module()
      currentData[module] = unitsData[module]
      data = currentData
    }
    return query(data, jPath, single)
  }
}

/**
 * Whether path is actually a link.
 * A link is string and start with 1-4 dollar mark, respent a pointer to unitsData or configData
 *
 * @param {string} path - path to locate the data
 *
 * @returns {boolean}
 */
function isLink(path) {
  return utils.isTypeOf(path, 'string') && RE_VAR.test(path)
}

/**
 * How many dollar mark the path has
 * @param {string} path - path to locate the data
 */
function count$(path) {
  if (path[0] !== '$') return 0
  return count$(path.slice(1)) + 1
}

/**
 * Whether path is actually a link to configData.
 * @param {string} path - path to locate the data
 *
 * @returns {boolean}
 */
function isLinkConfigData(path) {
  return path.slice(0, 4) === '$$$$'
}

/**
 * Wrap the normal path to jsonpath
 * @param {string} path - path to locate the data
 * @param {Unit} unit
 *
 * @returns {string} - jsonpath to locate data
 */
function toJPath(path, unit) {
  let n = count$(path)
  let segs = isLinkConfigData(path) ? ['$'] : ['$', unit.module(), unit.name()].slice(0, n)
  let prefix = jsonpath.stringify(segs)
  let tail = path.slice(n)
  return prefix + delimiter(tail) + tail
}

/**
 * Delimiter to concat jsonpath segment
 */
function delimiter(path) {
  return path[0] === '[' ? '' : '.'
}

/**
 * Use jsonpath to locate the data
 */
function query(source, jp, single) {
  let result
  try {
    result = jsonpath.query(source, jp)
  } catch (err) {
    result = []
  }
  return single ? result[0] : result
}

/**
 * Only pick the properties of unitsData which match the unit module name or dependencies
 */
function selectUnitsData(unitsData, unit) {
  let currentData = {}

  unit
    .dependencies()
    .slice()
    .forEach(({ name, module }) => {
      currentData[name] = unitsData[module]
    })

  return currentData
}
