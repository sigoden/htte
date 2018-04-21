const _ = require('lodash')

module.exports = function() {
  let serializers = []

  return {
    /**
     * Regist serializer
     * @param {object} plugin - model of serialize
     * @param {string} plugin.name - name of serializer, like json, xml
     * @param {string} plugin.type - http content type, like application/json
     * @param {function} plugin.serialize
     * @param {function} plugin.deserialize
     */
    regist(plugin) {
      if (!_.isPlainObject(plugin)) {
        throw new Error('argument is not valid')
      }
      let { name, type, serialize, deserialize } = plugin
      // validate name
      if (!name || typeof name !== 'string') {
        throw new Error('name must be a string')
      }
      if (this.findByName(name)) {
        throw new Error(`${name}: serializer conflict`)
      }
      // validate type
      if (!type || typeof type !== 'string') {
        throw new Error('type must be a string')
      }
      if (this.findByType(type)) {
        throw new Error(`${name}: already exist serializer with type ${type}`)
      }

      // validate serialize and deserialize
      if (typeof serialize !== 'function' || typeof deserialize !== 'function') {
        throw new Error(`${name}: serialize or deserialize must be function`)
      }

      serializers.push(plugin)
    },

    /**
     * List all the name of serializer
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
      return _.find(serializers, { type })
    }
  }
}
