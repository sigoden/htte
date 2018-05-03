const path = require('path')
const _ = require('lodash')

const utils = require('./utils')
const Graph = require('./graph')
const Logger = require('./logger')
const UnitModule = require('./unit-module')

/**
 * UnitManager read the test files in rootDir and returns Units
 *
 * @class UnitManager
 */
class UnitManager {
  /**
   * Create instance of UnitManager
   * @param {Config} config
   */
  constructor(config) {
    this._config = config
    this._logger = new Logger('LoadUnits')

    this._files = this.files()
    this._modules = this.modules()
    this._units = this.units()

    this._logger.tryThrow()
  }

  /**
   * Find the yaml module files recursivelly in the config.rootDir
   */
  files() {
    if (this._files) return this._files

    let files = utils
      .recursiveReadSync(this._config.rootDir())
      .filter(fp => /ya?ml$/.test(fp))
      .filter(f => {
        // omit the config yaml file
        return f != this._config.file()
      })
    return utils.sortFiles(files)
  }

  /**
   * Convert the files to test modules
   */
  modules() {
    if (this._modules) return this._modules
    let files = this.files()
    let config = this._config
    let modules = files
      .map(f => {
        let logger = this._logger.enter(f)
        return new UnitModule(f, config, logger, this)
      })
      .filter(module => module.valid())

    // sort based on dependency graph
    let graph = new Graph(unit => unit.dependencies().map(v => v.module))
    modules.forEach(module => graph.add(module.name(), module))
    try {
      modules = graph.sort()
    } catch (err) {
      this._logger.log(err.message)
    }

    return modules
  }

  /**
   * Check whether the module exists
   * @param {string} moduleFile - file path of module
   */
  isModuleExist(moduleFile) {
    return this.files().indexOf(moduleFile) > -1
  }

  /**
   * list Units
   *
   * @returns {Unit[]}
   */
  units() {
    if (this._units) return this._units
    return _.flatMap(this.modules(), module => module.units())
  }
}

module.exports = UnitManager
