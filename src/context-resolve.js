const resolve = require('./resolve')

/**
 * Context used to resolve value
 *
 * @class ContextResolve
 */
class ContextResolve {
  /**
   * Create instance of ContextResolve
   * @param {function} query - function to query linked data
   * @param {Logger} logger
   */
  constructor(query, logger) {
    this._query = query
    this._logger = logger
  }

  /**
   * Resolve the expect value
   * @param {ContextResolve} context - scoped context
   * @param {*} expect - expect value
   */
  resolve(context, expect) {
    return resolve(context, expect)
  }

  /**
   * Query the linked data
   * @param {string|*} path - jsonpath to linked data or any value
   * @param {boolean} single - whether returns single value or array
   */
  query(path, single = true) {
    return this._query(path, single)
  }

  /**
   * Log the error msg
   */
  error(msg) {
    return this._logger.log(msg)
  }

  /**
   * Clear all error msgs
   */
  clearLog() {
    return this._logger.clear()
  }

  /**
   * Wheter context has error
   */
  hasError() {
    return this._logger.dirty()
  }

  /**
   * Enter the scoped context
   */
  enter(title) {
    return new ContextResolve(this._query, this._logger.enter(title))
  }
}

module.exports = ContextResolve
