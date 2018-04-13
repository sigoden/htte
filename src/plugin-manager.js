const _ = require('lodash')
const yaml = require('js-yaml')

const PLUGIN_MARK = { differ: '@', resolver: '$' }
const PLUGIN_TYPES = Object.keys(PLUGIN_MARK)
const PLUGIN_KINDS = ['mapping', 'sequence', 'scalar']

module.exports = (function() {
  let plugins = []
  let yamlTypes = []

  return {
    /**
     * Regist plugin
     * @param {object} options - options to create plugin
     * @param {string} options.type - plugin type, one of [differ, resolver]
     * @param {string} options.kind - yaml kind, one of [mapping, sequence, scalar]
     * @param {string} options.name - plugin name, will be part of yaml tag name
     * @param {function} handler - construct function of yaml tag
     */
    regist(options) {
      let { type, kind, name, handler } = options
      // validate name
      if (typeof name !== 'string') {
        throw new Error(`name must be a string`)
      }
      if (_.find(plugins, { name, type })) {
        throw new Error(`${name}: plugin conflict`)
      }

      // validate type
      if (PLUGIN_TYPES.indexOf(type) === -1) {
        throw new Error(`${name}: type must be one of ${PLUGIN_TYPES}`)
      }

      // validate kind
      if (PLUGIN_KINDS.indexOf(kind) === -1) {
        throw new Error(`${name}: kind must be one of ${PLUGIN_KINDS}`)
      }

      // validate handler
      if (typeof handler !== 'function') {
        throw new Error(`${name}: handler must be function`)
      }

      yamlTypes.push(createYamlType(options))
      plugins.push(options)
    },

    /**
     * List yaml types
     */
    list() {
      return yamlTypes
    }
  }
})()

function createYamlType({ type, kind, name, handler }) {
  return new yaml.Type(tag(name, type), {
    kind,
    construct: literal => {
      return (context, actual) => {
        return handler(context, literal, actual)
      }
    }
  })
}

function tag(name, type) {
  return `!${PLUGIN_MARK[type]}${name}`
}
