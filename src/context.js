const jsonpath = require('jsonpath')

const utils = require('./utils')
const diff = require('./diff')
const resolve = require('./resolve')
const createQuery = require('./query-variable')

process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error.message, error.stack)
})

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
    this._config = config
    this._unit = unit
    this._session = session
    this._logger = logger

    this._query = createQuery(session.records(), config.variables(), unit)
  }

  /**
   * Get logger
   */
  logger() {
    return this._logger
  }

  /**
   * Create context for resolve the request
   */
  _resolveCtx(logger) {
    let self = this
    let ctx = {}
    // query the vairable
    ctx.query = (path, scalar) => {
      return self._query(path, scalar)
    }
    // log the error msg
    ctx.error = msg => logger.log(msg)
    // enter child context
    ctx.enter = title => self._resolveCtx(logger.enter(title))
    return ctx
  }

  /**
   * Create context for diff the response
   */
  _diffCtx(logger) {
    let self = this
    let ctx = {}
    // diff the value
    ctx.diff = diff
    // query the variable
    ctx.query = (path, scalar) => {
      return self._query(path, scalar)
    }
    // log the error msg
    ctx.error = msg => {
      return logger.log(msg)
    }
    // enter the child context
    ctx.enter = title => self._diffCtx(logger.enter(title))
    return ctx
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
    let logger = this._logger.enter('req')
    let result = resolve(this._resolveCtx(logger), req)
    if (logger.dirty()) return {}
    return result
  }

  /**
   * diff the response object
   *
   * @returns {boolean} - Whether pass the diff
   */
  diffRes(expect, res) {
    let logger = this._logger.enter('res')
    return diff(this._diffCtx(logger), expect, res, false)
  }
}

module.exports = Context
