class ContextResolve {
  constructor(query, logger) {
    this._query = query
    this._logger = logger
  }

  /**
   * Query the variable
   */
  query(path, single = true) {
    return this._query(path, single)
  }
  /**
   * Query the element of array for the variable
   */
  querys(array, single = true) {
    if (!Array.isArray(array)) {
      throw new Error('must be array')
    }
    let elems = []
    let errors = []
    let values = array.map(elem => {
      let value = this.query(elem, single)
      if (single && typeof value === 'undefined') {
        errors.push(elem)
      }
      return value
    })
    if (errors.length) throw new Error(`cannot find variables at ${errors.join('|')}`)
    return values
  }
  /**
   * Log the error msg
   */
  error(msg) {
    return this._logger.log(msg)
  }

  /**
   * Enter the scoped logger
   */
  enter(title) {
    return new ContextResolve(this._query, this._logger.enter(title))
  }
}

module.exports = ContextResolve
