const _ = require('lodash')
const axios = require('axios')
const qs = require('querystring')
const yaml = require('js-yaml')

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
    return this._api
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
    let _req = {}
    let _req$ = this._maybeObject(req, logger, _req)
    if (Object.is(_req, _req$)) return _req

    _req.body = req.body
    _req.headers = this._maybeObject(req.headers, logger.enter('headers'))
    _req.query = this._maybeObject(req.query, logger.enter('query'))
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

    params = this._maybeObject(params, logger)
    if (!params) return

    let apiKeys = this._api.keys
    if (!params && apiKeys.length) return logger.log('must have property [params]')

    let keys = _.keys(params).sort()
    let excludes = _.difference(keys, apiKeys)
    let includes = _.difference(apiKeys, keys)
    let errMsg = ``
    if (excludes.length) {
      errMsg += `, miss params ${JSON.stringify(excludes)}`
    }
    if (includes.length) {
      errMsg += `, extra params ${JSON.stringify(includes)}`
    }
    if (errMsg) {
      logger.log(`params different` + errMsg)
    }
    return params
  }

  /**
   * Validate res
   */
  _parseRes(res, logger) {
    let _res = {}

    let _res$ = this._maybeObject(res, logger, _res)
    if (Object.is(_res, _res$)) return _res

    _res.body = res.body
    _res.status = this._mayStatus(res.status, logger.enter('status'))
    let headers = this._maybeObject(res.headers, logger.enter('headers'))
    if (headers) {
      _res.headers = headers
    }

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
    let logger = ctx.logger().enter('req')
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
   * print req and res when debugging
   */
  debug(req, res, logger) {
    let _req, _res
    let tReq = this._template.req
    let tRes = this._template.res
    if (tReq) {
      _req = { url: this._axios.url, method: this._axios.method }
      if (tReq.headers) _req.headers = req.headers
      if (tReq.body) _req.body = req.body
      logger.enters(['debug', 'req']).log(JSON.stringify(_req))
    }
    if (tRes) {
      _res = { body: res.body }
      if (tRes.status) _res.status = res.status
      if (tRes.headers) _res.headers = res.headers
      logger.enters(['debug', 'res']).log(JSON.stringify(_res))
    }
  }

  /**
   * View unit
   */
  view(logger) {
    logger = logger.enters(this.describes().slice(0, -1))
    let describe = this._template.describe
    let id = this.id()
    let apiName = this._api.name
    logger.log([describe, id, apiName].join(' | '))
  }

  /**
   * Inspect unit
   */
  inspect({ req, res }) {
    let model = {
      name: this.name(),
      module: this.module(),
      api: this.api(),
      req,
      res
    }
    return yaml.safeDump(model, {
      schema: this._config.schema()
    })
  }

  /**
   * Create http request
   * @returns {Promise}
   */
  _request(api, req, logger) {
    if (logger.dirty()) return Promise.reject('cannot create request')

    let { name, method, url, keys } = api
    let { query, params, headers, type, body } = req
    let data, serializer

    if (keys.length) url = utils.fillUrlParams(url, params)

    if (query) url += '?' + qs.stringify(query)

    if (body) {
      serializer = this._config.findSerializer(type)
      try {
        data = serializer.serialize(body, name)
      } catch (err) {
        return Promise.reject('cannot serialize body, ${err}')
      }
    }

    if (serializer) {
      if (!headers) headers = {}
      headers['Content-Type'] = serializer.type
    }

    this._axios = { method, url, headers, data }
    return axios(this._axios)
  }
}

function unitName(name, indexes) {
  return name + DELIMITER + indexes.join(DELIMITER)
}

module.exports = Unit
