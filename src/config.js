const _ = require('lodash')
const path = require('path')
const os = require('os')
const yaml = require('js-yaml')
const md5 = require('md5')

const Logger = require('./logger')
const utils = require('./utils')
const PluginManager = require('./plugin-manager')
const SerializerManager = require('./serializer-manager')
const HTTP_METHODS = ['get', 'head', 'post', 'put', 'delete', 'connect', 'options', 'patch']
const { URL } = require('url')

const BUILTIN_SERIALIZERS = ['./serializers/json']
const BUILTIN_PLUGINS = ['./plugins']

const defaultConfig = {
  rootDir: '.',
  sessionFile: tmpfile(),
  type: 'json',
  timeout: 3000,
  url: 'http://localhost:3000',
  apis: {},
  exports: {},
  plugins: [],
  serializers: []
}

/**
 * Main Config class
 *
 * @class Config
 */
class Config {
  /**
   * Create instance of Config
   * @param {string} file - config file path
   */
  constructor(file) {
    if (!file) {
      this._file = path.resolve('.yaml')
      this._template = defaultConfig
    } else {
      this._file = path.resolve(file)
      this._template = _.defaultsDeep(loadConfig(this._file), defaultConfig)
    }

    this._logger = new Logger('LoadConfig')
    this._pluginM = PluginManager()
    this._serializerM = SerializerManager()

    this._parse(this._template)

    this._logger.tryThrow()
  }

  /**
   * Parse the yaml file, generate configuration
   * @param {Object} options - the raw config object
   * @param {string} options.rootDir - the root directory of test files
   * @param {string} options.sessionFile - the file to write session to
   * @param {string} options.type - the type of default serializer
   * @param {Integer} options.timeout - the timeout in millisecond of request
   * @param {string} options.url - the base url of all endpoints
   * @param {object|object[]} options.apis - the apis which describe endpoints
   * @param {Object} options.exports - exports data
   * @param {string[]} options.plugins  - the plugins to regist
   * @param {string[]} options.serializers  - the serializers to regist
   */
  _parse({ rootDir, sessionFile, type, timeout, url, apis, exports, plugins, serializers }) {
    let log = scope => this._logger.enter(scope)
    this._rootDir = this._parseRootDir(rootDir, log('rootDir'))
    this._sessionFile = this._parseSessionFile(sessionFile, log('sessionFile'))
    this._timeout = this._parseTimeout(timeout, log('timeout'))
    this._url = this._parseUrl(url, log('url'))
    this._exports = this._parseExports(exports, log('exports'))
    this._plugins = this._parsePlugins(plugins, log('plugins'))
    this._serializers = this._parseSerializers(serializers, log('serializers'))
    this._type = this._parseType(type, log('type'))
    this._apis = this._parseAPIs(apis, log('apis'))
  }

  /**
   * Check `rootDir` options
   * @param {string} rootDir - the rootDir directory of test files
   * @param {Logger} logger
   *
   * @returns {string} - absolute directory path
   */
  _parseRootDir(rootDir, logger) {
    const _rootDir = path.resolve(path.dirname(this._file), rootDir)
    if (utils.directoryExistsSync(_rootDir)) return _rootDir
    return logger.log(`must be valid directory at ${rootDir}`)
  }

  /**
   * Check `sessionFile` options, create if file does not exist
   * @param {string} sessionFile - the rootDir directory of test files
   * @param {Logger} logger
   *
   * @returns {string} - absolute session file path
   */
  _parseSessionFile(sessionFile, logger) {
    const _file = path.resolve(path.dirname(this._file), sessionFile)
    try {
      utils.ensureFileSync(_file)
      return _file
    } catch (err) {
      return logger.log(`must be valid file at ${_file}, ${err.message}`)
    }
  }

  /**
   * Check `type` options
   * @param {string} type - the type of default serializer
   * @param {Logger} logger
   *
   * @returns {string} - the type of default serializer
   */
  _parseType(name, logger) {
    let serializer = this._serializerM.findByName(name)
    if (serializer) return serializer.name
    return logger.log(`must be one of ${this._serializerM.names()}`)
  }

  /**
   * Check `timeout` options
   * @param {Integer} timeout - the timeout in millisecond of request
   * @param {Logger} logger
   *
   * @returns {Integer} - the timeout in millisecond of request
   */
  _parseTimeout(timeout, logger) {
    if (_.isInteger(timeout)) return timeout
    return logger.log(`must be integer`)
  }

  /**
   * Check `url` options, prepend `http://` if it omits
   * @param {string} url - the base url of all endpoints
   * @param {Logger} logger
   *
   * @returns {string} - the base url of all endpoints
   */
  _parseUrl(url, logger) {
    let _url = /https?:\/\//.test(url) ? url : 'http://' + url
    if (utils.isValidHttpUrl(_url)) return _url
    return logger.log(`must be valid web url, not ${url}`)
  }

  /**
   * Check `apis` options, normalize it to array of api object
   * @param {object|object[]} apis - the apis which describe endpoints
   * @param {Logger} logger
   *
   * apis:
   *  login:
   *    method: post
   *    uri: /users/login
   *  getUser: /user
   *
   * apis:
   *  - name: login
   *    method: post
   *    uri: /users/login
   *  - name: getUser
   *    uri: /user
   *
   * @returns {APIObject[]} - array of api object
   */
  _parseAPIs(apis, logger) {
    // url must be checked and valid
    if (!this._url) return []

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

    // check whether two APIObject have same name
    let names = utils.duplicateElements(_apis.map(v => v.name))
    if (names.length) return logger.log(`must have no conflict names ${names}`)

    // filter out invalid APIObjects
    return _apis.map(v => this.parseAPI(v, logger.enter(v.name))).filter(v => !!v)
  }

  /**
   * Normalize `apis` object to array of api object
   * @param {Object} apis - the apis which describe endpoints
   * @param {Logger} logger
   *
   * @returns {APIObject[]} - array of api object
   */
  _parseAPIsObject(apis, logger) {
    let func = (acc, value, key) => {
      let api
      switch (utils.type(value)) {
        case 'string':
          api = { uri: value, name: key }
          break
        case 'object':
          let { uri, method, type, timeout } = value
          if (!uri) return logger.enter(key).log('must be object with property uri')
          api = { uri, method, name: key, type, timeout }
          break
        default:
          return logger.enter(key).log('must be string or object')
      }
      acc.push(api)
    }
    return _.transform(apis, func, [])
  }

  /**
   * Normalize `apis` array to array of api object
   * @param {object[]} apis - the apis which describe endpoints
   * @param {Logger} logger
   *
   * @returns {APIObject[]} - array of api object
   */
  _parseAPIsArray(apis, logger) {
    let mapFunc = (api, index) => {
      if (!utils.isTypeOf(api, 'object')) {
        return logger.enter(`[${index}]`).log('must be object')
      }

      let { name, uri, method, timeout, type } = api
      if (!name) return logger.enter(`[${index}]`).log('must have property name')
      if (!uri) return logger.enter(`[${index}](${name})`).log('must have property uri')
      return { name, uri, method, type, timeout }
    }
    return _.map(apis, mapFunc).filter(v => !!v)
  }

  /**
   * An object describes endpoint
   * @typedef {Object} APIObject
   * @property {string} url - the url of endpoint
   * @property {string} method - the http method of endpoint
   * @property {string} type - the serializer of endpoint
   * @property {string} timeout - the timeout of request on the endpoint
   * @property {string[]} keys - the params of url
   */

  /**
   * Check and parse api object
   * @param {object} api - the raw api object
   * @param {string} api.uri - the uri of endpoint
   * @param {string|undefined} api.method - the http method of endpoint
   * @param {string|undefined} api.type - the serializer of endpoint
   * @param {string|undefined} api.timeout - the timeout of request on the endpoint
   * @param {Logger} logger
   *
   * @returns {APIObject} - the normalized api object
   */
  parseAPI(api, logger) {
    let _api = {}

    _api.name = api.name

    _api.method = (api.method || 'get').toLowerCase()
    if (HTTP_METHODS.indexOf(_api.method) < 0) {
      return logger.enter('method').log(`must be valid http method, not ${_api.method}`)
    }

    let urlObject
    try {
      urlObject = checkUrl(api.uri, this._url)
      _api.url = decodeURIComponent(urlObject.href)
      // collect url params
      // e.g. localhost/articles/{slug}/comments/{id} => ['slug', 'id']
      _api.keys = utils.collectUrlParams(decodeURIComponent(urlObject.pathname))
    } catch (err) {
      logger.enter('url').log(err.message)
    }

    _api.timeout = this._parseTimeout(api.timeout || this._timeout, logger.enter('timeout'))

    _api.type = this._parseType(api.type || this._type, logger.enter('type'))

    return _api
  }

  /**
   * Check `exports` options
   * @param {Object} data - exports data
   * @param {Logger} logger
   */
  _parseExports(data, logger) {
    if (!utils.isTypeOf(data, 'object')) return logger.log('must be object')
    return data
  }

  /**
   * Check `plugins` option
   * @param {string[]} plugins  - the plugins to regist
   * @param {Logger} logger
   *
   * plugins is a list of node modules, each module exports
   * an object like this:
   *
   * {
   *   differ: [
   *     { name: 'query', kind: 'scalar', handler: (context, literal, actual) { ... } }
   *     ...
   *   ],
   *   resolver: [
   *     { name: 'query', kind: 'scalar', handler: (context, literal) { ... } }
   *     ...
   *   ]
   * }
   *
   * @returns {string[]} - the name of registed plugins
   */
  _parsePlugins(plugins, logger) {
    if (!utils.isTypeOf(plugins, 'array')) return logger.log('must be array')
    plugins = BUILTIN_PLUGINS.concat(plugins)
    plugins.forEach(path => {
      let pluginModule
      let scopedLogger = logger.enter(path)
      try {
        pluginModule = require(path)
      } catch (err) {
        return scopedLogger.log(`cannot be required`)
      }
      if (!utils.isTypeOf(pluginModule, 'object')) {
        return scopedLogger.log('must be object')
      }
      this._registPlugins('differ', pluginModule.differ, scopedLogger.enter('differ'))
      this._registPlugins('resolver', pluginModule.resolver, scopedLogger.enter('resolver'))
    })
    return this._pluginM.names()
  }

  /**
   * Regist plugins
   * @param {string} type - type of plugins, one of [differ, resolver]
   * @param {object[]} plugins  - array of plugins to regist
   * @param {Logger} logger
   */
  _registPlugins(type, plugins = [], logger) {
    if (!utils.isTypeOf(plugins, 'array')) return logger.log('must be array')

    plugins.forEach((plugin, index) => {
      let scopedLogger = logger.enter(`[${index}]`)
      if (!utils.isTypeOf(plugin, 'object')) {
        return scopedLogger.log('must be object')
      }
      plugin.type = type
      try {
        this._pluginM.regist(plugin)
      } catch (err) {
        scopedLogger.log(err.message)
      }
    })
  }

  /**
   * Check `serializers` options
   * @param {string[]} serializers  - the serializers to regist
   * @param {Logger} logger
   *
   * serializers is a list of node modules, each module exports
   * an object like this:
   *
   * {
   *   name: 'json', // name of plugin
   *   type: 'application/json', // mime type of serializer
   *   serialize: (object, apiName) => {...}, // method to serialize object
   *   deserialize: (data, apiName) => {...} // method to deserialize data
   * }
   *
   * @returns {string[]} - the name of registed serializers
   */
  _parseSerializers(serializers, logger) {
    if (!utils.isTypeOf(serializers, ['array'])) {
      return logger.log('must be array')
    }
    serializers = BUILTIN_SERIALIZERS.concat(serializers)
    serializers.forEach(path => {
      let serializerModule
      let scopedLogger = logger.enter(path)
      try {
        serializerModule = require(path)
      } catch (err) {
        return scopedLogger.log(`cannot be required`)
      }
      try {
        this._serializerM.regist(serializerModule)
      } catch (err) {
        scopedLogger.log(err.message)
      }
    })
    return this._serializerM.names()
  }

  /**
   * Get the config file path
   *
   * @returns {string}
   */
  file() {
    return this._file
  }

  /**
   * Get the root directory of test files
   *
   * @returns {string}
   */
  rootDir() {
    return this._rootDir
  }

  /**
   * Get the exports to query global linked data
   *
   * @returns {Object}
   */
  exports() {
    return this._exports
  }

  /**
   * Get the session file path
   *
   * @returns {string}
   */
  sessionFile() {
    return this._sessionFile
  }

  /**
   * Find the api object by name
   * @param {string} name - the name of APIObject
   *
   * @returns {APIObject}
   */
  findAPI(name) {
    return _.find(this._apis, { name })
  }

  /**
   * Find the serializer by name or type
   * @param {string} nameOrType - name or type of serializer
   */
  findSerializer(nameOrType) {
    nameOrType = nameOrType || this._type
    let manager = this._serializerM
    return manager.findByName(nameOrType) || manager.findByType(nameOrType)
  }

  /**
   * Get the yaml schema used to load test files
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

// load config object from yaml file
function loadConfig(configFile) {
  try {
    return utils.loadYamlSync(configFile)
  } catch (err) {
    err.message = `can not load config file ${configFile}, ${err.message}`
    throw err
  }
}

// concat baseUrl if uri is relative and check wheter url is valid
function checkUrl(uri, baseUrl) {
  let url = uri.startsWith('/') ? baseUrl + uri : uri
  try {
    return new URL(url)
  } catch (err) {
    throw new Error(`must be valid web url, not ${url}`)
  }
}

// generate tmp file
function tmpfile() {
  let filename = `htte-session-${md5(process.cwd())}.json`
  return path.resolve(os.tmpdir(), filename)
}

module.exports = Config
