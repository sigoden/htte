const diff = require('./diff')

class ContextDiff {
  constructor(query, logger) {
    this._query = query
    this._logger = logger
  }

  /**
   * Diff the expect and actual value
   */
  diff(context, expect, actual, isStrict = true) {
    return diff(context, expect, actual, isStrict)
  }

  /**
   * Query the variable
   */
  query(path, single = true) {
    return this._query(path, single)
  }

  /**
   * Log the error msg
   */
  error(msg) {
    this._logger.log(msg)
    return false
  }

  /**
   * Clear the error msg
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
   * Enter the scoped logger
   */
  enter(title) {
    return new ContextDiff(this._query, this._logger.enter(title))
  }
}

module.exports = ContextDiff
