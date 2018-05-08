const utils = require('../utils')
const xml = require('fast-xml-parser')

module.exports = (config = {}) => {
  let J2XParser = new xml.j2xParser(config.serialize)
  let X2JParser = xml
  return {
    name: 'xml',
    contentType: () => {
      return utils.mergeTypeOptions('application/xml', config.contentType || {})
    },
    acceptType: type => {
      return type === 'application/xml' || type === 'text/xml'
    },
    serialize: object => J2XParser.parse(object),
    deserialize: data => {
      let result = X2JParser.parse(data, config.deserialize)
      if (!result) throw new Error('Fail to parse xml')
      return result
    }
  }
}
