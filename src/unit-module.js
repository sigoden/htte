const path = require('path')
const _ = require('lodash')

const utils = require('./utils')
const Unit = require('./unit')

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
   * Whether module is valid
   */
  valid() {
    return !this._logger.dirty()
  }

  /**
   * Convert module file path to module name
   * @param {string} file - path of module, can be relative or absolute
   */
  _moduleName(file) {
    file = this._absoluteFile(file)
    return utils.shortenFilePath(this._config.rootDir(), file).replace(new RegExp(path.sep, 'g'), '-')
  }

  /**
   * Get file absolute path
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
   * Parse the dependencies
   */
  _parseDependencies(dependencies, logger) {
    let _dependencies = []

    switch (utils.type(dependencies)) {
      case 'undefined':
        return _dependencies
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
        return _dependencies
    }

    _dependencies = _dependencies
      .map((dependency, index) => {
        return this._parseDependency(dependency, logger.enter(`[${index}]`))
      })
      .filter(v => !!v)

    // check the name confliction of dependencies
    let names = utils.duplicateElements(_dependencies.map(v => v.name))
    if (names.length > 0) {
      logger.log(`name conflict detect: ${names}`)
      return _dependencies
    }

    return _dependencies
  }

  /**
   * Parse the each dependency
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
        if (!module) {
          logger.log('must have property module')
          return
        }
        _file = this._absoluteFile(module)
        _name = name
        break
      default:
        logger.log(`must be string or object`)
        return
    }

    // check whether dependency exist
    if (!this._manager.isModuleExist(_file)) {
      logger.log(`cannot find dependency at ${_file}`)
      return
    }

    _module = this._moduleName(_file)
    return { name: _name || _module, module: _module }
  }

  /**
   * Parse units
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
   * Parse each unit
   */
  _parseUnit(unit, index, logger, scope) {
    if (!utils.isTypeOf(unit, 'object')) {
      return logger.log(`must be object`)
    }
    if (!unit.describe) {
      return logger.log(`must have property describe`)
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
