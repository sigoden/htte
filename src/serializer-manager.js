const _ = require('lodash')

/**
 * Manage serializers
 */
module.exports = function() {
  let serializers = []

  return {
    /**
     * Regist serializer
     * @param {Object} plugin - model of serialize
     * @param {string} plugin.name - name of serializer, like json, xml
     * @param {function} plugin.serialize - function to encode the object to specific data format
     * @param {function} plugin.deserialize - function to decode formated data to the object
     */
    regist(plugin) {
      if (!_.isPlainObject(plugin)) {
        throw new Error('argument is not valid')
      }
      let { name, serialize, deserialize, acceptType, contentType } = plugin
      // validate name
      if (!name || typeof name !== 'string') {
        throw new Error('name must be a string')
      }
      if (this.findByName(name)) {
        throw new Error(`${name}: serializer conflict`)
      }
      // validate serialize and deserialize
      if (typeof serialize !== 'function' || typeof deserialize !== 'function') {
        throw new Error(`${name}: serialize or deserialize must be function`)
      }

      // validate acceptType and contentType
      if (typeof acceptType !== 'function' || typeof contentType !== 'function') {
        throw new Error(`${name}: acceptType or contentType must be function`)
      }

      serializers.push({ name, serialize, deserialize, acceptType, contentType })
    },

    /**
     * List all names of serializers
     * returns {string[]}
     */
    names() {
      return serializers.map(v => v.name)
    },

    /**
     * Find serialize by name
     * @param {string} name
     */
    findByName(name) {
      return _.find(serializers, { name })
    },

    /**
     * Find serialize by type
     * @param {string} type
     */
    findByType(type) {
      return _.find(serializers, serializer => serializer.acceptType(type))
    }
  }
}
