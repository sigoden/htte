const diff = require('./diff')
/**
 * Context used to diff value
 *
 * @class ContextDiff
 */
class ContextDiff {
  /**
   * Create instance of ContextDiff
   * @param {function} query - function to query linked data
   * @param {Logger} logger
   */
  constructor(query, logger) {
    this._query = query
    this._logger = logger
  }

  /**
   * Diff the expect and actual value
   * @param {ContextDiff} context - scoped context
   * @param {*} expect - expect value
   * @param {*} actual - actual value
   * @param {boolean} isStrict - whether enables strict mode
   */
  diff(context, expect, actual, isStrict = true) {
    return diff(context, expect, actual, isStrict)
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
   *
   * @returns {boolean}
   */
  error(msg) {
    this._logger.log(msg)
    return false
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
    return new ContextDiff(this._query, this._logger.enter(title))
  }
}

module.exports = ContextDiff
