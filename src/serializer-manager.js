const _ = require('lodash')

module.exports = (function() {
  let serializers = []

  return {
    /**
     * Regist serializer
     * @param {object} options - model of serialize
     * @param {string} options.name - name of serializer, like json, xml
     * @param {string} options.type - http content type, like application/json
     * @param {function} options.serialize
     * @param {function} options.deserialize
     */
    regist({ name, type, serialize, deserialize }) {
      // validate name
      if (typeof name !== 'string') {
        throw new Error('name must be a string')
      }
      if (this.findByName(name)) {
        throw new Error(`${name}: serializer conflict`)
      }

      // validate type
      if (typeof type !== 'string') {
        throw new Error('type must be a string')
      }
      if (this.findByType(type)) {
        throw new Error(`${name}: already exist serializer with type ${type}`)
      }

      // validate serialize and deserialize
      if (
        typeof serialize !== 'function' ||
        typeof deserialize !== 'function'
      ) {
        throw new Error(`${name}: serialize or deserialize must be function`)
      }

      serializers.push({ name, type, serialize, deserialize })
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
})()
