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
    logger.log(`cannot find api ${api}`)
  }

  /**
   * Validate req
   */
  _parseReq(req, logger) {
    let type = utils.type(req)

    let _req = {}

    if (type === 'undefined') {
      return _req
    } else if (type !== 'object') {
      logger.log(`must be object`)
      return _req
    }

    if (req.body) _req.body = _.clone(req.body)
    if (!utils.isTypeOf(req.headers, 'undefined')) {
      if (!utils.isTypeOf(req.headers, 'object')) {
        logger.enter('headers').log('must be object')
      } else {
        _req.headers = _.clone(req.headers)
      }
    }
    if (!utils.isTypeOf(req.query, 'undefined')) {
      if (!utils.isTypeOf(req.query, 'object')) {
        logger.enter('query').log('must be object')
      } else {
        _req.query = _.clone(req.query)
      }
    }

    let params = this._parseReqParams(req.params, logger.enter('params'))
    if (params) _req.params = _.clone(params)

    let reqType = this._parseReqType(req.type, logger.enter('type'))
    if (reqType) _req.type = reqType

    return _req
  }

  /**
   * Validate req code
   */
  _maybeStatus(status, logger) {
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

    let type = utils.type(params)
    if (type !== 'undefined' && type !== 'object') {
      return logger.log('must be object')
    }

    let apiKeys = this._api.keys
    if (!params && apiKeys.length) return logger.log('must have property [params]')

    let keys = _.keys(params).sort()
    let excludes = _.difference(apiKeys, keys)
    let includes = _.difference(keys, apiKeys)
    let errMsg = ``
    if (excludes.length) {
      errMsg += `, missed ${excludes.join('|')}`
    }
    if (includes.length) {
      errMsg += `, extra ${includes.join('|')}`
    }
    if (errMsg) {
      return logger.log(`params diff` + errMsg)
    }
    return params
  }

  /**
   * Validate res
   */
  _parseRes(res, logger) {
    let _res = {}

    let type = utils.type(res)
    if (type === 'undefined') {
      return _res
    } else if (type === 'object') {
      _res = _.clone(res)
    } else {
      return logger.log('must be object')
    }

    if (res.body) _res.body = res.body

    if (res.status) {
      _res.status = this._maybeStatus(res.status, logger.enter('status'))
    }

    if (res.headers) {
      if (!utils.isTypeOf(res.headers, 'object')) {
        logger.enter('headers').log('must be object')
      } else {
        _res.headers = res.headers
      }
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
        return { err: err.message }
      })
      .then(res => {
        res.time = process.hrtime(this._hrstart)[1] / 1000000
        if (res.err) {
          return { req, res, pass: false }
        }
        ctx.record('req', req)
        let pass = ctx.diffRes(this._res, res)
        return { req, res, pass }
      })
  }

  /**
   * print req and res when debug
   */
  debug(req, res, logger) {
    if (!this._axios) {
      // no request sent, no info to dump
      return
    }

    let tReq = this._template.req
    let tRes = this._template.res
    let output = {}

    output.req = { url: this._axios.url, method: this._axios.method }
    if (tReq && tReq.headers) output.req.headers = req.headers
    if (tReq && tReq.body) output.req.body = req.body

    output.res = {}
    if (res.status) output.res.status = res.status
    if (res.body) output.res.body = res.body
    if (res.err) output.res.err = res.err.toString()
    if (tRes && tRes.headers) output.res.headers = res.headers

    logger.enter('debug').log(yaml.safeDump(output))
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
    return yaml.safeDump(model)
  }

  /**
   * Create http request
   * @returns {Promise}
   */
  _request(api, req, logger) {
    if (logger.dirty()) return Promise.reject('cannot create request')

    let { name, method, url, keys } = api
    let { query, params, headers = {}, type, body } = req

    if (keys.length) url = utils.fillUrlParams(url, params)

    if (query) url += '?' + qs.stringify(query)

    this._axios = { method, url, headers }

    if (body) {
      let serializer = this._config.findSerializer(type)
      try {
        this._axios.data = serializer.serialize(body, name)
      } catch (err) {
        return Promise.reject(`cannot serialize body, ${err}`)
      }
      headers['Content-Type'] = serializer.type
    }

    this._hrstart = process.hrtime()
    return axios(this._axios)
  }
}

function unitName(name, indexes) {
  return name + DELIMITER + indexes.join(DELIMITER)
}

module.exports = Unit
