const _ = require('lodash')
const yaml = require('js-yaml')

const PLUGIN_MARK = { differ: '@', resolver: '$' }
const PLUGIN_TYPES = Object.keys(PLUGIN_MARK)
const PLUGIN_KINDS = ['mapping', 'sequence', 'scalar']

const ContextDiff = require('./context-diff')
const ContextResolve = require('./context-resolve')

module.exports = function() {
  let plugins = []
  let yamlTypes = []

  return {
    /**
     * Regist plugin
     * @param {object} plugin - plugin to create plugin
     * @param {string} plugin.type - plugin type, one of [differ, resolver]
     * @param {string} plugin.kind - yaml kind, one of [mapping, sequence, scalar]
     * @param {string} plugin.name - plugin name, will be part of yaml tag name
     * @param {function} handler - construct function of yaml tag
     */
    regist(plugin) {
      if (!_.isPlainObject(plugin)) {
        throw new Error('argument is not valid')
      }
      let { type, kind, name, handler } = plugin
      // validate name
      if (!name || typeof name !== 'string') {
        throw new Error(`name must be a string`)
      }
      // validate type
      if (PLUGIN_TYPES.indexOf(type) === -1) {
        throw new Error(`${name}: type must be one of ${PLUGIN_TYPES}`)
      }

      if (_.find(plugins, { name, type })) {
        throw new Error(`${name}: plugin conflict`)
      }

      // validate kind
      if (PLUGIN_KINDS.indexOf(kind) === -1) {
        throw new Error(`${name}: kind must be one of ${PLUGIN_KINDS}`)
      }

      // validate handler
      if (typeof handler !== 'function') {
        throw new Error(`${name}: handler must be function`)
      }

      yamlTypes.push(createYamlType(plugin))
      plugins.push(plugin)
    },
    /**
     * List plugin names
     */
    names() {
      return yamlTypes.map(v => v.tag)
    },
    /**
     * List yaml types
     */
    list() {
      return yamlTypes
    }
  }
}

function createYamlType({ type, kind, name, handler }) {
  return new yaml.Type(tag(name, type), {
    kind,
    construct: literal => {
      return (context, actual) => {
        if (type === 'resolver' && context instanceof ContextResolve) {
          let _literal = context.resolve(context, literal)
          if (context.hasError()) return
          return handler(context, _literal)
        } else if (type === 'differ' && context instanceof ContextDiff) {
          return handler(context, literal, actual)
        }
        let errMsg = ''
        if (type === 'differ') {
          errMsg = 'use differ plugin in resolver context'
        } else {
          errMsg = 'use resolver plugin in differ context'
        }
        if (context.error) {
          return context.error(errMsg)
        }
        throw new Error('context is not valid')
      }
    }
  })
}

function tag(name, type) {
  return `!${PLUGIN_MARK[type]}${name}`
}
