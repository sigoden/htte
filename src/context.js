const jsonpath = require('jsonpath')

const utils = require('./utils')
const diff = require('./diff')
const resolve = require('./resolve')
const createQuery = require('./create-query')
const ContextDiff = require('./context-diff')
const ContextResolve = require('./context-resolve')

class Context {
  /**
   * Create instance of Context
   *
   * @param {Unit} unit - test case
   * @param {Session} session
   * @param {Config} config
   * @param {Logger} logger
   */
  constructor(unit, session, config, logger) {
    this._unit = unit
    this._session = session
    this._config = config
    this._logger = logger
    this._query = createQuery(this._session.records(), this._config.exports(), this._unit)
  }

  /**
   * Get logger
   */
  logger() {
    return this._logger
  }

  /**
   * Record key-value pairs of unit into session
   * @param {string} key - the key to store value
   * @param {*} value - the value will be stored
   *
   * if unit.id() is auth.login, record(req, { body: { username: 'john', token: '...' } })
   * will store below object to session
   * {
   *   auth: {
   *     login: {
   *       req: {
   *         body: {
   *           username: 'john',
   *           token: '...'
   *         }
   *       }
   *     }
   *   }
   * }
   */
  record(key, value) {
    this._session.writeUnit(this._unit, key, value)
  }

  /**
   * resolve the request
   * @param {Object} req - the request object
   */
  resolveReq(req) {
    if (utils.isTypeOf(req, 'undefined')) return {}
    let logger = this._logger.enter('req')
    let result = resolve(new ContextResolve(this._query, logger), req)
    return result
  }

  /**
   * diff the response
   * @param {Object} res - the response object
   *
   * @returns {boolean} - Whether pass
   */
  diffRes(expect, res) {
    let logger = this._logger.enter('res')
    let ctx = new ContextDiff(this._query, logger)
    let [statusDiffed, headersDiffed, bodyDiffed] = [true, true, true]
    let diffStatusOrBody = false
    if (expect.status) {
      diffStatusOrBody = true
      statusDiffed = diff(ctx.enter('status'), expect.status, res.status)
    }
    if (expect.body) {
      diffStatusOrBody = true
      bodyDiffed = diff(ctx.enter('body'), expect.body, res.body)
    }
    if (expect.headers) {
      headersDiffed = diff(ctx.enter('headers'), expect.headers, res.headers, false)
    }
    if (!diffStatusOrBody && res.status > 299) {
      return ctx.enter('status').error('>299')
    }
    return statusDiffed && headersDiffed && bodyDiffed
  }
}

module.exports = Context
