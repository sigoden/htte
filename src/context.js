const jsonpath = require('jsonpath')

const utils = require('./utils')
const diff = require('./diff')
const resolve = require('./resolve')
const createQuery = require('./query-variable')
const ContextDiff = require('./context-diff')
const ContextResolve = require('./context-resolve')

class Context {
  /**
   * Create instance of Context
   *
   * @param {Unit} unit
   * @param {Session} session
   * @param {Config} config
   * @param {Logger} logger
   */
  constructor(unit, session, config, logger) {
    this._unit = unit
    this._session = session
    this._config = config
    this._logger = logger
    this._query = createQuery(this._session.records(), this._config.variables(), this._unit)
  }

  /**
   * Get logger
   */
  logger() {
    return this._logger
  }

  /**
   * Record the value to the session
   */
  record(key, value) {
    this._session.writeUnit(this._unit, key, value)
  }

  /**
   * resolve the requst object
   */
  resolveReq(req) {
    if (utils.isTypeOf(req, 'undefined')) return {}
    let logger = this._logger.enter('req').setOptions({ follow: false })
    let result = resolve(new ContextResolve(this._query, logger), req)
    if (logger.dirty()) {
      return logger.exit().log(logger.toString(0))
    }
    return result
  }

  /**
   * diff the response object
   *
   * @returns {boolean} - Whether pass the diff
   */
  diffRes(expect, res) {
    let logger = this._logger.enter('res').setOptions({ follow: false })
    let ctx = new ContextDiff(this._query, logger)
    let [statusDiffed, headersDiffed, bodyDiffed] = [true, true, true]
    if (expect.status) {
      statusDiffed = diff(ctx.enter('status'), expect.status, res.status)
    }
    if (expect.headers) {
      headersDiffed = diff(ctx.enter('headers'), expect.headers, res.headers)
    }
    if (expect.body) {
      bodyDiffed = diff(ctx.enter('body'), expect.body, res.body)
    }
    if (logger.dirty()) logger.exit().log(logger.toString(0))
    return statusDiffed && headersDiffed && bodyDiffed
  }
}

module.exports = Context
