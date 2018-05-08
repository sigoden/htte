const utils = require('../utils')

module.exports = (config = {}) => {
  return {
    name: 'json',
    contentType: () => {
      return utils.mergeTypeOptions('application/json', config.contentType || {})
    },
    acceptType: type => type === 'application/json',
    serialize: object => JSON.stringify(object),
    deserialize: data => JSON.parse(data)
  }
}
