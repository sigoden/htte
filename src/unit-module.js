const path = require('path')
const _ = require('lodash')

const utils = require('./utils')
const Unit = require('./unit')

/**
 * UnitModule parse a test file as module and returns Units
 *
 * @class UnitModule
 */
class UnitModule {
  /**
   * Create instance of UnitModule
   * @param {string} file - moudle file
   * @param {Config} config - instance of Config
   * @param {Logger} logger - instance of logger
   * @param {UnitManager} manager - instance of UnitManager
   */
  constructor(file, config, logger, manager) {
    this._file = file
    this._config = config
    this._logger = logger
    this._manager = manager

    this._name = this._moduleName(this._file)
    this._logger.setTitle(this.name())
    this._template = this._load()
    if (!this._template) return

    this._dependencies = this._parseDependencies(this._template.dependencies, this._logger.enter('dependencies'))

    this._units = this._parseUnits(this._template.units, this._logger.enter('units'), new Scope()).filter(u => {
      return u.valid()
    })
  }

  /**
   * Whether the module is valid
   */
  valid() {
    return !this._logger.dirty()
  }

  /**
   * Convert module file path to module name
   * @param {string} file - file path of module, can be relative or absolute
   */
  _moduleName(file) {
    file = this._absoluteFile(file)
    return utils.shortenFilePath(this._config.rootDir(), file).replace(new RegExp(path.sep, 'g'), '-')
  }

  /**
   * Get file's absolute path
   * @param {string} file - file path
   */
  _absoluteFile(file) {
    if (!path.isAbsolute(file)) {
      file = path.resolve(path.dirname(this._file), file)
    }
    return file
  }

  /**
   * Get the module name
   */
  name() {
    return this._name
  }

  /**
   * Load module yaml file
   */
  _load() {
    try {
      return utils.loadYamlSync(this._file, {
        schema: this._config.schema()
      })
    } catch (err) {
      return this._logger.log(`fail to load or parse moudle file, ${err.message}`)
    }
  }

  /**
   * Get the module dependencies
   */
  dependencies() {
    return this._dependencies
  }

  /**
   * Get the module units
   */
  units() {
    return this._units
  }

  /**
   * Parse the dependencies of module
   *
   * e.g. dependencies in mapping form:
   *
   * dependencies:
   *  auth: ./auth.yaml
   *  article: ./articles-authorized.yaml
   *
   * e.g. dependencies in sequence form:
   *
   * dependencies:
   *  - ./auth.yaml
   *  - name: article
   *    module: ./articles-authorized.yaml
   *
   * @param {Object|Object[]} dependencies - the module dependencies
   * @param {Logger} logger
   */
  _parseDependencies(dependencies, logger) {
    let _dependencies

    switch (utils.type(dependencies)) {
      case 'undefined':
        return []
      case 'object':
        let func = (r, v, k) => {
          r.push({ module: v, name: k })
        }
        _dependencies = _.transform(dependencies, func, [])
        break
      case 'array':
        _dependencies = dependencies
        break
      default:
        logger.log('should be object or array')
        return []
    }

    _dependencies = _dependencies
      .map((dependency, index) => {
        return this._parseDependency(dependency, logger.enter(`[${index}]`))
      })
      .filter(v => !!v)

    // detect whether module have name confliction
    let names = utils.duplicateElements(_dependencies.map(v => v.name))
    if (names.length > 0) logger.log(`must have no conflict names ${names}`)

    return _dependencies
  }

  /**
   * Parse the each dependency of module
   * @param {Object} dependency - module dependency
   * @param {Logger} logger
   */
  _parseDependency(dependency, logger) {
    let _name, _module, _file

    // normalize dependency
    switch (utils.type(dependency)) {
      case 'string':
        _file = this._absoluteFile(dependency)
        break
      case 'object':
        let { name, module } = dependency
        if (!module) return logger.enter('module').log('required')
        _file = this._absoluteFile(module)
        _name = name
        break
      default:
        return logger.log(`must be string or object`)
    }

    // check whether dependence exists
    if (!this._manager.isModuleExist(_file)) {
      return logger.log(`cannot find dependency at ${_file}`)
    }

    _module = this._moduleName(_file)
    return { name: _name || _module, module: _module }
  }

  /**
   * Parse units
   *
   * e.g. units form:
   *
   * units:
   *  - describe: child unit object
   *    api: getModel
   *  - describe: child units
   *    units:
   *      - describe: grand child unit object
   *        api: getModel
   *
   * @param {Object[]} units
   * @param {Logger} logger
   * @param {Scope} scope
   *
   * @returns {Unit[]}
   */
  _parseUnits(units, logger, scope) {
    let _units = []

    if (!_.isArray(units)) {
      logger.log(`must be array`)
      return _units
    }

    _units = units
      .map((unit, index) => {
        return this._parseUnit(unit, index, logger.enter(`[${index}]`), scope)
      })
      .filter(v => !!v)

    return _.flatMap(_units)
  }

  /**
   * Parse single unit
   *
   * @param {Object} unit
   * @param {Integer} index - index of array
   * @param {Logger} logger
   * @param {Scope} scope
   *
   * @returns {Unit}
   */
  _parseUnit(unit, index, logger, scope) {
    if (!utils.isTypeOf(unit, 'object')) {
      return logger.log(`must be object`)
    }
    if (!unit.describe) {
      return logger.enter('describe').log(`required`)
    }
    logger.setTitle(`[${index}](${unit.describe})`)

    let _scope = scope.enter(index, unit.describe)

    // unit group
    if (unit.units) {
      let _logger = logger.enter(`[${index}]units`)
      return this._parseUnits(unit.units, _logger, _scope)
    }

    return new Unit(unit, this._config, logger, _scope, this)
  }
}

/**
 * Scope record unit indexes and describes
 *
 * @class Scope
 */
class Scope {
  constructor(indexes = [], describes = []) {
    this._indexes = indexes
    this._describes = describes
  }
  enter(index, describe) {
    return new Scope(this._indexes.concat(index), this._describes.concat(describe))
  }
}

module.exports = UnitModule
module.exports.Scope = Scope
