const jsonpath = require('jsonpath')
const fs = require('fs')
const _ = require('lodash')

class Session {
  /**
   * Create instance of Session
   * @param {string} sessionFile - file path to save or restore session
   */
  constructor(sessionFile) {
    this._file = sessionFile
    this._records = {}
    this._cursor = 0
  }

  /**
   * Write the unit data to session
   *
   * the struct of records will be:
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
      return _records
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
    debugger
    fs.writeFileSync(this._file, JSON.stringify(model))
  }

  /**
   * Restore from disk
   */
  restore() {
    let content = fs.readFileSync(this._file, 'utf8')
    if (content.length === 0) return
    try {
      let model = JSON.parse(content)
      this.setCursor(model.cursor)
      this.setRecords(model.records)
    } catch (err) {}
  }
}

module.exports = Session
