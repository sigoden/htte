const jsonpath = require('jsonpath')
const utils = require('./utils')

const RE_VAR = /^\${1,4}/

/**
 * Create an query function to query the var by jsonpath
 *
 * @params {object} unitVars
 * @params {object} globalVars
 * @params {Unit} unit
 *
 * Jsonpath pattern:
 * - $$$$a.b.c - global vars
 * - $$$res.body.id - current unit (unitVars)
 * - $$signup1.res.body.token - current module (unitVars)
 * - $auth.signup1.res.body.token - cross module (unitVars)
 *
 * @returns {function}
 */
module.exports = function createQuery(unitVars, globalVars, unit) {
  let currentVars = selectVars(unitVars, unit)

  return (value, single = true) => {
    if (!isVar(value)) return value
    let jPath = toJPath(value, unit)
    let vars
    if (isVarGlobal(value)) {
      vars = globalVars
    } else {
      let module = unit.module()
      currentVars[module] = unitVars[module]
      vars = currentVars
    }
    return query(vars, jPath, single)
  }
}

function isVar(path) {
  return utils.isTypeOf(path, 'string') && RE_VAR.test(path)
}

function count$(path) {
  if (path[0] !== '$') return 0
  return count$(path.slice(1)) + 1
}

function isVarGlobal(path) {
  return path.slice(0, 4) === '$$$$'
}

/**
 * translate path to jsonpath
 */
function toJPath(path, unit) {
  let n = count$(path)
  let segs = isVarGlobal(path) ? ['$'] : ['$', unit.module(), unit.name()].slice(0, n)
  let prefix = jsonpath.stringify(segs)
  let tail = path.slice(n)
  return prefix + delimiter(tail) + tail
}

function delimiter(path) {
  return path[0] === '[' ? '' : '.'
}

function query(source, jp, single) {
  let result
  try {
    result = jsonpath.query(source, jp)
  } catch (err) {
    result = []
  }
  return single ? result[0] : result
}

function selectVars(unitVars, unit) {
  let currentVars = {}

  unit
    .dependencies()
    .slice()
    .forEach(({ name, module }) => {
      currentVars[name] = unitVars[module]
    })

  return currentVars
}
