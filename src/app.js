const Logger = require('./logger')
const Config = require('./config')
const UnitManager = require('./unit-manager')
const Session = require('./session')
const PluginManager = require('./plugin-manager')
const SerializerManager = require('./serializer-manager')
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
   *
   * @memberof App
   */
  constructor(file) {
    this._loadPlugins()
    this._loadSerializers()
    this._config = new Config(file)
    this._units = new UnitManager(this._config).units()
    this._session = new Session(this._config.sessionFile())
    this._print = console.log
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
    let units, cursor
    try {
      let result = this._activeUnits(options)
      units = result.units
      cursor = result.cursor
    } catch (err) {
      return Promise.reject(err)
    }

    let logger = new Logger('RunUnits', { follow: true })

    return units
      .reduce((promise, unit) => {
        return promise
          .then(isContinue => {
            return this._runUnit(isContinue, unit, logger.enters(unit.describes()), options).then(v => {
              cursor += 1
              this._session.cursor(cursor)
              return v
            })
          })
          .catch(err => {
            logger.log(err.stack)
          })
      }, Promise.resolve(true))
      .then(() => {
        this._session.persist()
      })
  }

  /**
   * run single unit
   */
  _runUnit(isContinue, unit, logger, options) {
    if (!isContinue) return Promise.resolve(isContinue)
    let self = this
    let ctx = new Context(unit, self._session, self._config, logger)
    return unit.execute(ctx).then(({ req, res, pass }) => {
      if (!pass && options.bail) {
        if (options.debug) {
          logger.enters(['debug', 'req']).log(JSON.stringify(req))
          logger.enters(['debug', 'res']).log(JSON.stringify(res))
        } else if (res.err) {
          logger.enter('res').log(res.err)
        }
        return false
      }
      self._session.writeUnit(unit, 'res', res)
      logger.log('ok')
      return true
    })
  }

  /**
   * view the uints
   */
  view(options) {
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
    let _units = filterFunc(units, u => u.module(), options.module)
    _units = filterFunc(_units, u => u.api(), options.api)

    _units.forEach(u => u.view(logger))

    this._print(logger.toString())
  }

  /**
   * inspect specific unit
   */
  inspect(options) {
    let cursor = 0
    this._session.restore()

    // get cusor point the start position of units
    if (options.unit) {
      cursor = _.findIndex(this._units, unit => unit.id() === options.unit)
      if (cursor < 0) {
        throw new Error(`Cannot find unit ${options.unit}`)
      }
    } else if (options.amend) {
      cursor = this._session.cursor()
    }

    let unit = this._units[cursor]
    let data = this._session.readUnit(unit)

    this._print(unit.inspect(data))
  }

  /**
   * Get the tests on schedule
   */
  _activeUnits(options) {
    let cursor = 0
    // get cusor point the start position of units
    if (options.unit) {
      // if unit is set, find it's index
      cursor = _.findIndex(this._units, unit => unit.id() === options.unit)
      if (cursor < 0) {
        throw new Error(`Cannot find unit ${options.unit}`)
      }
    } else if (options.amend) {
      // find the last failure test
      this._session.restore()
      cursor = this._session.cursor()
    }

    let units

    // if shot is set, only run one unit
    if (options.shot) {
      units = [this._units[cursor]]
    }

    units = this._units.slice(cursor)
    return { units, cursor }
  }

  /**
   * Load buildin plugin
   */
  _loadPlugins() {
    let plugins = [
      'differ/array',
      'differ/q',
      'differ/object',
      'differ/x',

      'resolver/q',
      'resolver/jwt',
      'resolver/now'
    ]
    plugins.forEach(path => {
      PluginManager.regist(require(`./plugins/${path}`))
    })
  }

  /**
   * Load buildin serializer
   */
  _loadSerializers() {
    let serializers = ['json']
    serializers.forEach(path => {
      SerializerManager.regist(require(`./serializers/${path}`))
    })
  }
}

module.exports = App
