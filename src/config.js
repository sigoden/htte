const _ = require('lodash')
const path = require('path')
const yaml = require('js-yaml')

const Logger = require('./logger')
const utils = require('./utils')
const PluginManager = require('./plugin-manager')
const SerializerManager = require('./serializer-manager')
const HTTP_METHODS = ['get', 'head', 'post', 'put', 'delete', 'connect', 'options', 'patch']

const defaultConfig = {
  rootDir: '.',
  sessionFile: './.session',
  serializer: 'json',
  url: 'http://localhost:3000',
  apis: {},
  variables: {}
}

class Config {
  /**
   * Create instance of Config
   */
  constructor(file) {
    this._file = path.resolve(file)
    this._logger = new Logger('LoadConfig')

    let loadedConfig = loadConfig(this._file)
    this._template = _.defaultsDeep(loadedConfig, defaultConfig)
    this._parse(this._template)

    this._logger.tryThrow()
  }

  /**
   * Parse the yaml config, generate valid config value
   */
  _parse({ rootDir, sessionFile, serializer, url, apis, variables }) {
    let logger = this._logger
    this._rootDir = this._parseRootDir(rootDir, logger.enter('rootDir'))
    this._sessionFile = this._parseSessionFile(sessionFile, logger.enter('sessionFile'))
    this._serializer = this._parseSerializer(serializer, logger.enter('serializer'))
    this._url = this._parseUrl(url, logger.enter('url'))
    this._apis = this._parseAPIs(apis, logger.enter('apis'))
    this._variables = this._parseVariables(variables, logger.enter('variables'))
  }

  /**
   * Parse and check rootDir option
   */
  _parseRootDir(rootDir, logger) {
    const _rootDir = path.resolve(rootDir)
    if (utils.directoryExistsSync(_rootDir)) return _rootDir
    return logger.log(`must be a valid directory at ${rootDir}`)
  }

  /**
   * Parse and check sessionFile option
   */
  _parseSessionFile(sessionFile, logger) {
    const _file = path.resolve(sessionFile)
    try {
      utils.ensureFileSync(_file)
      return _file
    } catch (err) {
      return logger.log(`must be a valid file at ${_file}, ${err}`)
    }
  }

  /**
   * Parse and check serializer option
   */
  _parseSerializer(name, logger) {
    let serializer = SerializerManager.findByName(name)
    if (serializer) return serializer
    return logger.log(`${name} must be one of ${SerializerManager.getNames()}`)
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

    if (!_apis) return

    // check name conflict of apis
    let names = utils.duplicateElements(_apis.map(v => v.name))
    if (names.length) return logger.log(`name conflict, ${names}`)

    return _apis.map(v => this._modifyAPI(v))
  }

  /**
   * Modify parsed api
   */
  _modifyAPI(api) {
    // add property url, it's absolute url
    if (api.uri.startsWith('/')) {
      api.url = this._url + api.uri
    }

    api.keys = utils.collectUrlParams(api.url)
    // default http method
    api.method = api.method || 'get'
    return api
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
      if (api) acc.push(api)
    }
    return _.transform(apis, func, [])
  }

  /**
   * Parse apis when apis options is array
   */
  _parseAPIsArray(apis, logger) {
    let mapFunc = (value, index) => {
      if (!utils.isTypeOf(value, 'object')) {
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
   * Parse and check variables option
   */
  _parseVariables(variables, logger) {
    if (!utils.isTypeOf(variables, ['object', 'undefined'])) return logger.log('must be object')
    return variables
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
    if (_.isUndefined(type)) return this._serializer
    return SerializerManager.findByType(type) || this._serializer
  }

  /**
   * Get the schema for loading yaml
   */
  schema() {
    if (this._schema) return this._schema
    let plugins = PluginManager.list()

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
    err.message = `Can not load config file ${configFile}, ${err.message}`
    throw err
  }
}

module.exports = Config
