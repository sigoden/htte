const jsonpath = require('jsonpath')
const _ = require('lodash')

const RE_VAR = /^\${1,4}/

/**
 * Create an query function to query the var by jsonpath
 *
 * @params {object} globalVars - an object for lookuping global var
 * @params {object} vars - an object for lookuping unit var
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
module.exports = function createQuery(globalVars, vars, unit) {
  let unitVars = selectVars(vars, unit)

  return (path, single = true) => {
    if (!isVar(path)) return path
    let jPath = toJPath(path, unit)
    let vars = isVarGlobal(path) ? globalVars : unitVars
    return query(vars, jPath, single)
  }
}

function isVar(path) {
  return RE_VAR.test(path)
}

function isVarGlobal(path) {
  return count$(path) === 4
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
  let segs = ['$', unit.module(), unit.name()].slice(0, _.clamp(1, 3, 4 - n))
  let prefix = jsonpath.stringify(segs)
  let tail = path.slice(n)
  return prefix + delimiter(tail) + tail
}

function delimiter(path) {
  return path[0] === '[' ? '' : '.'
}

function query(sink, jp, single) {
  try {
    let result = jsonpath.query(source, jp)
    return single ? result[0] : result
  } catch (err) {
    return single ? undefined : []
  }
}

function selectVars(vars, unit) {
  let unitVars = {}
  let module = unit.module()

  unit
    .dependencies()
    .slice()
    .map(({ name, module }) => ({ name, module }))
    .concat([{ name: module, module }])
    .forEach(({ name, module }) => {
      unitVars[name] = vars[module]
    })

  return unitVars
}
