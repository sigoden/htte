const _ = require('lodash')
const path = require('path')
const yaml = require('js-yaml')

const Logger = require('./logger')
const utils = require('./utils')
const PluginManager = require('./plugin-manager')
const SerializerManager = require('./serializer-manager')
const HTTP_METHODS = ['get', 'head', 'post', 'put', 'delete', 'connect', 'options', 'patch']
const { URL } = require('url')

const defaultConfig = {
  rootDir: '.',
  sessionFile: './.session',
  serializer: 'json',
  url: 'http://localhost:3000',
  apis: {},
  variables: {},
  plugins: []
}

class Config {
  /**
   * Create instance of Config
   */
  constructor(file) {
    this._file = path.resolve(file)
    this._logger = new Logger('LoadConfig')
    this._pluginM = PluginManager()
    this._serializerM = SerializerManager()

    this._loadSerializers()

    this._template = _.defaultsDeep(loadConfig(this._file), defaultConfig)

    this._parse(this._template)

    this._logger.tryThrow()
  }

  /**
   * Parse the yaml config, generate valid config value
   */
  _parse({ rootDir, sessionFile, serializer, url, apis, variables, plugins }) {
    let logger = this._logger
    this._rootDir = this._parseRootDir(rootDir, logger.enter('rootDir'))
    this._sessionFile = this._parseSessionFile(sessionFile, logger.enter('sessionFile'))
    this._serializer = this._parseSerializer(serializer, logger.enter('serializer'))
    this._url = this._parseUrl(url, logger.enter('url'))
    this._apis = this._parseAPIs(apis, logger.enter('apis'))
    this._variables = this._parseVariables(variables, logger.enter('variables'))
    this._plugins = this._parsePlugins(plugins, logger.enter('plugins'))
  }

  /**
   * Parse and check rootDir option
   */
  _parseRootDir(rootDir, logger) {
    const _rootDir = path.resolve(path.dirname(this._file), rootDir)
    if (utils.directoryExistsSync(_rootDir)) return _rootDir
    return logger.log(`must be valid directory at ${rootDir}`)
  }

  /**
   * Parse and check sessionFile option
   */
  _parseSessionFile(sessionFile, logger) {
    const _file = path.resolve(path.dirname(this._file), sessionFile)
    try {
      utils.ensureFileSync(_file)
      return _file
    } catch (err) {
      return logger.log(`must be valid file at ${_file}, ${err}`)
    }
  }

  /**
   * Parse and check serializer option
   */
  _parseSerializer(name, logger) {
    let serializer = this._serializerM.findByName(name)
    if (serializer) return serializer
    return logger.log(`${name} must be one of ${this._serializerM.names()}`)
  }

  /**
   * Parse and check url option
   */
  _parseUrl(url, logger) {
    if (utils.isValidHttpUrl(url)) return url
    let _url = 'http://' + url
    if (utils.isValidHttpUrl(_url)) return _url
    return logger.log(`${url} must be valid web url`)
  }

  /**
   * Parse and check apis option
   */
  _parseAPIs(apis, logger) {
    if (!this._url) {
      logger.log('cannot parse apis because url is not correct')
      return []
    }

    let _apis
    switch (utils.type(apis)) {
      case 'object':
        _apis = this._parseAPIsObject(apis, logger)
        break
      case 'array':
        _apis = this._parseAPIsArray(apis, logger)
        break
      default:
        return logger.log('must be array or object')
    }

    // check name conflict of apis
    let names = utils.duplicateElements(_apis.map(v => v.name))
    if (names.length) return logger.log(`name conflict, ${names.join('|')}`)

    return _apis.map(v => this._modifyAPI(v, logger.enter(v.name))).filter(v => !!v)
  }

  /**
   * Parse apis when apis options is object
   */
  _parseAPIsObject(apis, logger) {
    let func = (acc, value, key) => {
      let api
      switch (utils.type(value)) {
        case 'string':
          api = { uri: value, name: key }
          break
        case 'object':
          let { uri, method } = value
          if (!uri) return logger.enter(key).log('must be object have property uri')
          api = { uri, method, name: key }
          break
        default:
          return logger.enter(key).log('must be string or object')
      }
      acc.push(api)
    }
    return _.transform(apis, func, [])
  }

  /**
   * Parse apis when apis options is array
   */
  _parseAPIsArray(apis, logger) {
    let mapFunc = (api, index) => {
      if (!utils.isTypeOf(api, 'object')) {
        return logger.enter(`[${index}]`).log('must be object')
      }

      let { name, uri, method } = api
      if (!name) return logger.enter(`[${index}]`).log('must have property name')
      if (!uri) return logger.enter(`[${index}]${name}`).log('must have property uri')
      return { name, uri, method }
    }
    return _.map(apis, mapFunc).filter(v => !!v)
  }

  /**
   * Modify parsed api
   */
  _modifyAPI(api, logger) {
    let _api = _.pick(api, ['name', 'method'])
    // add property url, it's absolute url
    if (api.uri.startsWith('/')) {
      _api.url = this._url + api.uri
    } else {
      _api.url = api.uri
    }

    let url
    try {
      url = new URL(_api.url)
    } catch (err) {
      return logger.log(`invalid url at ${_api.uri}`)
    }

    _api.keys = utils.collectUrlParams(decodeURIComponent(url.pathname))
    // default http method
    _api.method = _api.method || 'get'

    if (HTTP_METHODS.indexOf(_api.method) < 0) {
      return logger.log(`invalid http method ${_api.method}`)
    }
    return _api
  }

  /**
   * Parse and check variables option
   */
  _parseVariables(variables, logger) {
    if (!utils.isTypeOf(variables, ['object', 'undefined'])) return logger.log('must be object')
    return variables
  }

  /**
   * Parse the plugins option
   */
  _parsePlugins(plugins, logger) {
    if (!utils.isTypeOf(plugins, 'array')) return logger.log('must be array')
    plugins = ['./plugins'].concat(plugins)
    plugins.forEach(pluginPath => {
      let plugin
      let pluginLogger = logger.enter(pluginPath)
      try {
        plugin = require(pluginPath)
      } catch (err) {
        return pluginLogger.log(`cannot load plugin, ${err}`)
      }
      if (!utils.isTypeOf(plugin, 'object')) {
        return pluginLogger.log('must be object have property differ or resolver')
      }
      let doRegistDiffer = this._loadPlugins('differ', plugin.differ, pluginLogger.enter('differ'))
      let doRegistResolver = this._loadPlugins('resolver', plugin.resolver, pluginLogger.enter('resolver'))
      if (!doRegistDiffer && !doRegistResolver) {
        return pluginLogger.log('cannot regist any plugin')
      }
    })
    return this._pluginM.names()
  }

  /**
   * Load each plugin
   */
  _loadPlugins(type, plugins, logger) {
    if (!utils.isTypeOf(plugins, ['array', 'undefined'])) {
      return logger.log('must be array')
    }
    if (!plugins) return
    let registed
    plugins.forEach((plugin, index) => {
      let pluginLogger = logger.enter(`[${index}]`)
      if (!utils.isTypeOf(plugin, 'object')) {
        return pluginLogger.log('must be object')
      }
      plugin.type = type
      try {
        this._pluginM.regist(plugin)
        registed = true
      } catch (err) {
        pluginLogger.log(`cannot regist plugin, ${err.message}`)
      }
    })
    return registed
  }

  /**
   * Load builtin serializer
   */
  _loadSerializers() {
    let serializers = ['json']
    serializers.forEach(path => {
      this._serializerM.regist(require(`./serializers/${path}`))
    })
  }

  /**
   * Get the config file path
   */
  file() {
    return this._file
  }

  /**
   * Get the parsed rootDir option
   */
  rootDir() {
    return this._rootDir
  }

  /**
   * Get the parsed variables option
   */
  variables() {
    return this._variables
  }

  sessionFile() {
    return this._sessionFile
  }

  /**
   * Find the api object by name
   */
  findAPI(name) {
    return _.find(this._apis, { name })
  }

  /**
   * Find the serializer by type
   */
  findSerializer(type) {
    if (typeof type === 'undefined') return this._serializer
    let m = this._serializerM
    return m.findByName(type) || m.findByType(type)
  }

  /**
   * Get the schema for loading yaml
   */
  schema() {
    if (this._schema) return this._schema
    let plugins = this._pluginM.list()

    this._schema = new yaml.Schema({
      include: [yaml.DEFAULT_SAFE_SCHEMA],
      explicit: plugins
    })
    return this._schema
  }
}

function loadConfig(configFile) {
  try {
    return utils.loadYamlSync(configFile)
  } catch (err) {
    err.message = `can not load config file ${configFile}, ${err.message}`
    throw err
  }
}

module.exports = Config
