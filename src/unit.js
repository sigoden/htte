const _ = require('lodash')
const axios = require('axios')
const qs = require('querystring')

const utils = require('./utils')
const DELIMITER = '-'

class Unit {
  /**
   * Create instance of unit
   */
  constructor(template, config, logger, scope, module) {
    this._config = config
    this._logger = logger
    this._module = module
    this._scope = scope
    this._template = template

    let { api, req, res } = template
    this._api = this._parseAPI(api, logger.enter('api'))
    this._req = this._parseReq(req, logger.enter('req'))
    this._res = this._parseRes(res, logger.enter('res'))
  }

  /**
   * Whether unit model is valid
   */
  valid() {
    return !this._logger.dirty()
  }

  /**
   * Get unit name
   */
  name() {
    if (!this._name) {
      if (this._template.name) {
        this._name = this._template.name
      } else {
        this._name = unitName(this._api.name, this._scope._indexes)
      }
    }
    return this._name
  }

  /**
   * Get unit's module name
   */
  module() {
    return this._module.name()
  }

  /**
   * Get unit's api
   */
  api() {
    return this._api.name
  }

  /**
   * Get unit's qualified name, global unique
   */
  id() {
    return this.module() + DELIMITER + this.name()
  }

  /**
   * Get dependencies of unit, inherit from module
   */
  dependencies() {
    return this._module.dependencies()
  }

  /**
   * Get describes of unit
   */
  describes() {
    return this._scope._describes
  }

  /**
   * Validate api
   */
  _parseAPI(api, logger) {
    let _api = this._config.findAPI(api)
    if (_api) return _api
    logger.log(`cannot find api ${value}`)
    return false
  }

  /**
   * Validate req
   */
  _parseReq(req, logger) {
    let _req = { status: 200 }
    let _req$ = this._maybeObject(req, logger, _req)
    if (Object.is(_req, _req$)) return _req

    _req.headers = this._maybeObject(req.headers, logger.enter('headers'))
    _req.query = this._maybeObject(req.query, logger.enter('query'))
    _req.status = this._mayStatus(req.status, logger.enter('status'))
    _req.params = this._parseReqParams(req.params, logger.enter('params'))
    _req.type = this._parseReqType(req.type, logger.enter('type'))
    return _req
  }

  /**
   * Asset value should be undefined or object
   */
  _maybeObject(value, logger, defaultValue) {
    if (!utils.isTypeOf(value, ['object', 'undefined'])) {
      logger.log('must be an object')
      return defaultValue
    }
    return value ? value : defaultValue
  }

  /**
   * Validate req code
   */
  _mayStatus(status = 200, logger) {
    if (!_.isInteger(status)) return logger.log('must be http code')
    return status
  }

  /**
   * Validate req type
   */
  _parseReqType(type, logger) {
    let serializer = this._config.findSerializer(type)
    if (!serializer) return logger.log(`unregist type ${type}`)
    return type
  }

  /**
   * Validate req params, params sholud match url params
   */
  _parseReqParams(params, logger) {
    if (!this._api) return

    params = this._maybeObject(params)
    if (!params) return

    let apiKeys = this._api.keys
    if (!params && apiKeys.length) return logger.log('must have property [params]')

    let keys = _.keys(params).sort()
    let excludes = _.difference(keys, apiKeys)
    if (excludes.length) {
      debugger
      logger.log(`no params ${excludes}`)
    }
    let includes = _.difference(apiKeys, keys)
    if (includes.length) {
      logger.log(`extra params ${includes}`)
    }
  }

  /**
   * Validate res
   */
  _parseRes(res, logger) {
    let _res = {}

    let _res$ = this._maybeObject(res, logger, _res)
    if (Object.is(_res, _res$)) return _res

    _res.headers = this._maybeObject(res.headers, logger.enter('headers'))
    _res.status = this._mayStatus(res.status, logger.enter('status'))

    return _res
  }

  /**
   * Execute the test case
   *
   * @param {Context} ctx - execution environment
   *
   * @returns {Promise} - result of execution
   */
  execute(ctx) {
    let req = ctx.resolveReq(this._req)
    let logger = this._logger.enter('req')
    return this._request(this._api, req, logger)
      .then(({ status, headers, data: body }) => {
        return { status, headers, body }
      })
      .catch(err => {
        if (err.response) {
          let { status, headers, data: body } = err.response
          return { status, headers, body }
        }
        return { err }
      })
      .then(res => {
        if (res.err) {
          return { req, res, pass: false }
        }
        ctx.record('req', req)
        let pass = ctx.diffRes(this._res, res)
        return { req, res, pass }
      })
  }

  /**
   * View unit
   */
  view(logger) {
    logger = logger.enters(this.describes().slice(0, -1))
    let describe = this._template.describe
    let name = this.name()
    let apiName = this._api.name
    logger.log([describe, name, apiName].join(' | '))
  }

  /**
   * Inspect unit
   */
  inspect(record = {}) {
    return `name: ${this.name()}
module: ${this.module()}
describes: ${this.describes()}
api:
  name: ${this.api().name}
  method: ${this.api().method}
  url: ${this.api().url}
req: ${record.req && JSON.stringify(record.req)}
res: ${record.req && JSON.stringify(record.res)}
`
  }

  /**
   * Create http request
   * @returns {Promise}
   */
  _request(api, req, logger) {
    debugger
    if (this._dirty) return Promise.reject('have trouble to create request')

    let { name, method, url, keys } = api
    let { query, params, headers, type, body } = req
    let data, serializer

    if (keys.length) url = utils.fillUrlParams(url, params)

    if (query) url += '?' + qs.stringify(query)

    if (body) {
      serializer = this._config.findSerializer(type)
      try {
        data = serialize.serialize(body, name)
      } catch (err) {
        logger.log(`cannot serialize body, ${err}`)
      }
      return Promise.reject('have trouble to serialize body')
    }

    if (serializer) {
      if (!headers) headers = {}
      headers['Content-Type'] = serializes.type
    }

    return axios({ method, url, headers, data })
  }
}

function unitName(name, indexes) {
  return name + DELIMITER + indexes.join(DELIMITER)
}

module.exports = Unit
