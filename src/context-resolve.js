const resolve = require('./resolve')

class ContextResolve {
  constructor(query, logger) {
    this._query = query
    this._logger = logger
  }

  /**
   * Resolve the literal value
   */
  resolve(context, expect) {
    return resolve(context, expect)
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
    return this._logger.log(msg)
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
    return new ContextResolve(this._query, this._logger.enter(title))
  }
}

module.exports = ContextResolve
