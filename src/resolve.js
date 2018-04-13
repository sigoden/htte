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
      return value(context)
    case 'array':
      return value.map((elem, index) => {
        return resolve(context.enter(`[${index}]`, elem))
      })
    case 'object':
      return _.mapValues(value, (fieldValue, fieldKey) => {
        return resolve(context.enter(fieldKey), fieldValue)
      })
    default:
      return context.error(`value invalid: ${JSON.stringify(value)}`)
  }
}

module.exports = resolve
