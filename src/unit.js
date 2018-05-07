const _ = require('lodash')
const axios = require('axios')
const qs = require('querystring')
const yaml = require('js-yaml')

const utils = require('./utils')
const DELIMITER = '-'

/**
 * UnitModule parse a unit data object as Unit instance
 *
 * unit data object is:
 *
 * describe: test unit
 * api: getModel
 * name: unitName
 * req:
 *  headers:
 *    Authorization: Bearer ...
 *  query:
 *    page: 3
 *    size: 20
 *  params:
 *    id: 33
 *  body:
 *    key: value
 * res:
 *  status: 200
 *  headers:
 *    Content-Type: application/json
 *  body:
 *    key: value
 *
 * @class Unit
 */
class Unit {
  /**
   * Create instance of unit
   * @param {Object} template - data to be parsed
   * @param {Config} config
   * @param {Logger} logger
   * @param {Scope} scope
   * @param {UnitModule} module
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
   * Whether unit instance is valid
   */
  valid() {
    return !this._logger.dirty()
  }

  /**
   * Get unit's name
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
   * Get unit's APIObject
   */
  api() {
    return this._api
  }

  /**
   * Get unit's qualified name, unique in htte project
   */
  id() {
    return this.module() + DELIMITER + this.name()
  }

  /**
   * Get unit's dependencies, inherited from module
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
   * Check and retrive APIObject
   * @param {string|Object} api - name of APIObject
   * @param {Logger} logger
   */
  _parseAPI(api, logger) {
    if (!utils.isTypeOf(api, ['string', 'object'])) return logger.log(`must be string or object`)
    let _api
    if (typeof api === 'string') {
      _api = this._config.findAPI(api)
      if (!_api) return logger.log(`cannot find api ${api}`)
    } else {
      if (!api.uri) return logger.log('must have properties uri')
      if (!api.name) api.name = (api.method || 'get') + ' ' + api.uri
      _api = this._config.parseAPI(api, logger)
    }
    return _api
  }

  /**
   * Check and parse request data object
   * @param {Object} req - data to generate request object
   * @param {Logger} logger
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

    return _req
  }

  /**
   * Validate http status code
   * @param {Integer} status - http status code
   * @param {Logger} logger
   */
  _maybeStatus(status, logger) {
    if (!_.isInteger(status)) return logger.log('must be valid http code')
    return status
  }

  /**
   * Validate url params then complete the url
   *
   * if url is http://localhost:3000/articles/{slug}/comments/{id}, params is { slug: how-to, id: 33 },
   * the completed url will be http://localhost:3000/articles/how-to/comments/33
   *
   * @param {Object} params - http status code
   * @param {Logger} logger
   */
  _parseReqParams(params, logger) {
    if (!this._api) return

    let type = utils.type(params)
    if (type !== 'undefined' && type !== 'object') {
      return logger.log('must be object')
    }

    let apiKeys = this._api.keys
    if (!params && apiKeys.length) return logger.log('must have property params')

    let keys = _.keys(params).sort()
    let excludes = _.difference(apiKeys, keys)
    let includes = _.difference(keys, apiKeys)
    let errMsg = ``
    if (excludes.length) {
      errMsg += `, ++ ${excludes.join('|')}`
    }
    if (includes.length) {
      errMsg += `, -- ${includes.join('|')}`
    }
    if (errMsg) {
      return logger.log(`params diff` + errMsg)
    }
    return params
  }

  /**
   * Check and parse expected response data object
   * @param {Object} req - data used to diff response
   * @param {Logger} logger
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
   * Execute the test, make request and collect response
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
        body = this._deserialize(body, headers['content-type'])
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
   * Deserialize body
   * @param {*} data - body data
   * @param {string} contentType - content-type of body data
   */
  _deserialize(data, contentType) {
    if (!contentType) return data
    let contentTypeOmitParams = contentType.split(';')[0]
    let serializer = this._config.findSerializer(contentTypeOmitParams)
    if (!serializer) return data
    // json already deserialized
    if (serializer.name === 'json') return data
    return serializer.deserialize(data, this._api.name)
  }

  /**
   * Print req and res data
   * @param {*} req - req data of the unit
   * @param {*} res - res data of the unit
   * @param {Logger} logger
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
   * @param {Logger} logger
   */
  view(logger) {
    let viewLogger = logger.enter(this.module()).enters(this.describes())
    viewLogger.log(`${this.name()}`)
  }

  /**
   * Inspect unit
   */
  inspect({ req, res }) {
    let model = {
      name: this.name(),
      module: this.module(),
      api: this.api(),
      req: req || {},
      res: res || {}
    }
    return yaml.safeDump(model)
  }

  /**
   * Create http request
   * @returns {Promise}
   */
  _request(api, req, logger) {
    if (logger.dirty()) return Promise.reject('cannot create request')

    let { name, method, url, keys, type, timeout } = api
    let { query, params, headers = {}, body } = req

    if (keys.length) url = utils.fillUrlParams(url, params)

    if (query) url += '?' + qs.stringify(query)

    this._axios = { method, url, headers, timeout }

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
