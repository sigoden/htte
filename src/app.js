const _ = require('lodash')

const Logger = require('./logger')
const Config = require('./config')
const UnitManager = require('./unit-manager')
const Session = require('./session')
const Context = require('./context')

/**
 * Main App class
 *
 * @class App
 */
class App {
  /**
   * Create an instance of App.
   *
   * @param {string} file - path config file
   * @param {function} print -  how to print the info
   *
   * @memberof App
   */
  constructor(file, print) {
    this._ready = false
    this._print = print || console.log

    try {
      this._config = new Config(file)
      this._units = new UnitManager(this._config).units()
      this._ready = true
    } catch (err) {
      this._print(err)
    }

    this._session = new Session(this._config.sessionFile())
  }

  /***
   * Run batch of test uints sequentially
   *
   * @param {Object} options - Options to control run behavior
   * @param {boolean} options.bail - Whether to stop at failed unit
   * @param {boolean} options.amend - Whether to continue from last failed unit
   * @param {boolean} options.shot - Run only specific unit then stop
   * @param {boolean} options.dubug - Whether dump req and res when failed
   * @param {string} options.unit - The name of unit to run
   *
   * @returns {Promise}
   */
  run(options) {
    if (!this._ready) return Promise.resolve()
    let units, cursor
    try {
      cursor = this._unitCursor(options.unit, options.amend)
    } catch (err) {
      return Promise.reject(err)
    }
    if (options.shot) {
      units = [this._units[cursor]]
    } else {
      units = this._units.slice(cursor)
    }

    let logger = new Logger('RunUnits', { follow: true, logFunc: this._print })

    let exitStatus = 0
    return units
      .reduce((promise, unit) => {
        return promise.then(isContinue => {
          let unitLogger = logger.enter(unit.module()).enters(unit.describes())
          return this._runUnit(isContinue, unit, unitLogger, options).then(v => {
            if (v) {
              cursor += 1
              if (cursor === this._units.length) cursor = 0
              this._session.setCursor(cursor)
            } else {
              exitStatus = 1
            }
            return v
          })
        })
      }, Promise.resolve(true))
      .then(() => {
        this._session.persist()
        return exitStatus
      })
  }

  /**
   * run single unit
   */
  _runUnit(isContinue, unit, logger, options) {
    if (!isContinue) return Promise.resolve(isContinue)
    let self = this
    let ctx = new Context(unit, self._session, self._config, logger)
    return unit
      .execute(ctx)
      .then(({ req, res, pass }) => {
        if (options.debug || (options.bail && !pass)) {
          unit.debug(req, res, logger)
        }
        if (pass) {
          logger.log(`ok [${res.time}ms]`)
        } else {
          if (res.err) {
            logger.enter('res').log(res.err)
            // flat error, or it will throw 'Converting circular structure to JSON' in session.persist
            res.err = res.err.message
          }
        }
        self._session.writeUnit(unit, 'res', res)
        return pass || !options.bail
      })
      .catch(err => {
        this._print(err)
        return false
      })
  }

  /**
   * view the uints
   */
  view(options) {
    if (!this._ready) return

    let units = this._units
    let logger = new Logger('ViewTests')
    let filterFunc = (colletion, valueFunc, candicates) => {
      if (!candicates || !candicates.length) {
        return colletion
      }
      if (Array.isArray(candicates)) {
        return _.filter(colletion, v => candicates.indexOf(valueFunc(v)) > -1)
      } else {
        return _.filter(colletion, v => valueFunc(v) === candicates)
      }
    }
    units = filterFunc(units, u => u.module(), options.module)
    units = filterFunc(units, u => u.api().name, options.api)

    units.forEach(u => u.view(logger))

    this._print(logger.toString())
  }

  /**
   * inspect specific unit
   */
  inspect(options) {
    if (!this._ready) return

    let cursor
    try {
      cursor = this._unitCursor(options.unit, true)
    } catch (err) {
      this._print(err)
      return
    }

    let unit = this._units[cursor]

    let data = this._session.readUnit(unit)
    this._print(unit.inspect(data || {}))
  }

  /**
   * Get unit cursor
   */
  _unitCursor(id, useSessionCursor) {
    let cursor = 0
    if (!this._units.length) {
      throw new Error(`cannot find unit`)
    }
    if (id) {
      cursor = _.findIndex(this._units, unit => unit.id() === id)
      if (cursor < 0) {
        throw new Error(`cannot find unit ${id}`)
      }
    } else if (useSessionCursor) {
      this._session.restore()
      cursor = this._session.cursor()
    }
    if (!this._units[cursor]) cursor = 0
    return cursor
  }
}

module.exports = App
