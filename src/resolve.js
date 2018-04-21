const _ = require('lodash')
const utils = require('./utils')

function resolve(context, value) {
  switch (utils.type(value)) {
    case 'number':
    case 'boolean':
    case 'string':
    case 'null':
    case 'undefined':
      return value
    case 'function':
      try {
        return value(context)
      } catch (err) {
        return context.error(`cannot resolve, ${err}`)
      }
    case 'array':
      return value.map((elem, index) => {
        return resolve(context.enter(`[${index}]`), elem)
      })
    default:
      return _.mapValues(value, (fieldValue, fieldKey) => {
        return resolve(context.enter(fieldKey), fieldValue)
      })
  }
}

module.exports = resolve
