const jsonpath = require('jsonpath')
const fs = require('fs')
const _ = require('lodash')

/**
 * Session used to save and persist the req and res data of units
 */
class Session {
  /**
   * Create instance of Session
   * @param {string} sessionFile - file to persist session
   */
  constructor(sessionFile) {
    this._file = sessionFile
    this._records = {}
    this._cursor = 0
  }

  /**
   * Write the unit data to session
   *
   * the data will be records as:
   *
   * _records:
   *    module:
   *       name:
   *         key: value
   *
   * @param {Unit} unit - a instance of unit case
   * @param {string} key - field name
   * @param {*}  value - field value
   */
  writeUnit(unit, key, value) {
    let path = [unit.module(), unit.name(), key]
    _.set(this._records, path, value)
  }

  /**
   * Read the unit data from session
   *
   * @param {Unit} unit - a instance of unit case
   */
  readUnit(unit, key) {
    let path = [unit.module(), unit.name()]
    if (key) path.push(key)
    return _.get(this._records, path)
  }

  /**
   * Get records
   */
  records() {
    return this._records
  }

  /**
   * Get cursor
   */
  cursor() {
    return this._cursor
  }

  /**
   * Set cursor
   * @param {int} cursor - index of units
   */
  setCursor(cursor) {
    if (_.isInteger(cursor)) {
      this._cursor = cursor
      return cursor
    }
  }

  /**
   * Replace records
   * @param {Object} records - records used to replace
   */
  setRecords(records) {
    if (_.isPlainObject(records)) {
      this._records = records
      return this._records
    }
  }

  /*
   * Persist to disk
   */
  persist() {
    let model = {
      records: this.records(),
      cursor: this.cursor()
    }
    fs.writeFileSync(this._file, JSON.stringify(model))
  }

  /**
   * Restore from disk
   */
  restore() {
    let content = fs.readFileSync(this._file, 'utf8')
    try {
      let model = JSON.parse(content)
      this.setCursor(model.cursor)
      this.setRecords(model.records)
    } catch (err) {}
  }
}

module.exports = Session
