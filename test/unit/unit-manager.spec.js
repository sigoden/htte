const Config = require('../../src/config')
const Logger = require('../../src/logger')
const UnitManager = require('../../src/unit-manager')
const UnitModule = require('../../src/unit-module')
const Unit = require('../../src/unit')
const utils = require('../../src/utils')
const { resolveFixtureFile } = require('./helper')

describe('Test UnitManager', () => {
  let config = new Config({ configFile: resolveFixtureFile('./unit-manager/demo1/config.yaml') })
  let manager = new UnitManager(config)
  test('private property', () => {
    expect(manager._config).toBe(config)
    expect(manager._logger).toBeInstanceOf(Logger)
    expect(manager._files).toEqual([
      resolveFixtureFile('./unit-manager/demo1/module1.yaml'),
      resolveFixtureFile('./unit-manager/demo1/module2.yaml')
    ])
    expect(manager._modules).toHaveLength(2)
    expect(manager._modules[0]).toBeInstanceOf(UnitModule)
    expect(manager._modules[0].name()).toEqual('module1')
    expect(manager._units).toHaveLength(2)
    expect(manager._units[0]).toBeInstanceOf(Unit)
    expect(manager._units[0].id()).toEqual('module1-getFeed-0')
  })
})

describe('public function', () => {
  describe('files', () => {
    test('return module files', () => {
      let config = new Config({ configFile: resolveFixtureFile('./unit-manager/demo1/config.yaml') })
      let manager = new UnitManager(config)
      expect(manager.files()).toEqual([
        resolveFixtureFile('./unit-manager/demo1/module1.yaml'),
        resolveFixtureFile('./unit-manager/demo1/module2.yaml')
      ])
    })
    test('only load yaml file with ext yaml or yml', () => {
      let { manager } = init()
      let recursiveReadSyncOrigin = utils.recursiveReadSync
      utils.recursiveReadSync = jest
        .fn()
        .mockImplementation(() => [
          resolveFixtureFile('./unit-manager/a.yaml'),
          resolveFixtureFile('./unit-manager/b.yml'),
          resolveFixtureFile('./unit-manager/c'),
          resolveFixtureFile('./unit-manager/d.txt')
        ])
      manager._files = undefined
      expect(manager.files()).toEqual([
        resolveFixtureFile('./unit-manager/a.yaml'),
        resolveFixtureFile('./unit-manager/b.yml')
      ])
      utils.recursiveReadSync = recursiveReadSyncOrigin
    })
    test('omit config yaml file', () => {
      let { config, manager } = init()
      let recursiveReadSyncOrigin = utils.recursiveReadSync
      utils.recursiveReadSync = jest.fn().mockImplementation(() => [config._file])
      manager._files = undefined
      expect(manager.files()).toEqual([])
      utils.recursiveReadSync = recursiveReadSyncOrigin
    })
    test('sort files by name', () => {
      let { manager } = init()
      let recursiveReadSyncOrigin = utils.recursiveReadSync
      utils.recursiveReadSync = jest
        .fn()
        .mockImplementation(() => [
          resolveFixtureFile('./unit-manager/abc/d.yaml'),
          resolveFixtureFile('./unit-manager/ab.yml'),
          resolveFixtureFile('./unit-manager/a.yaml')
        ])
      manager._files = undefined
      expect(manager.files()).toEqual([
        resolveFixtureFile('./unit-manager/a.yaml'),
        resolveFixtureFile('./unit-manager/ab.yml'),
        resolveFixtureFile('./unit-manager/abc/d.yaml')
      ])
      utils.recursiveReadSync = recursiveReadSyncOrigin
    })
  })
  describe('modules', () => {
    test('return unit module', () => {
      let config = new Config({ configFile: resolveFixtureFile('./unit-manager/demo1/config.yaml') })
      let manager = new UnitManager(config)
      expect(manager.modules()).toHaveLength(2)
      expect(manager.modules()[0]).toBeInstanceOf(UnitModule)
    })
    test('circular dependence detect', () => {
      let config = new Config({ configFile: resolveFixtureFile('./unit-manager/demo2/config.yaml') })
      expect(() => new UnitManager(config)).toThrow('circular dependency detected, module2 -> module1')
    })
    test('sort by dependence', () => {
      let config = new Config({ configFile: resolveFixtureFile('./unit-manager/demo3/config.yaml') })
      let manager = new UnitManager(config)
      expect(manager.modules()[0].name()).toEqual('module2')
    })
  })
  describe('isModuleExist', () => {
    test('should detect whether module exists', () => {
      let { manager } = init()
      manager.files = jest.fn().mockImplementation(() => [resolveFixtureFile('./unit-manager/a.yaml')])
      expect(manager.isModuleExist(resolveFixtureFile('./unit-manager/a.yaml'))).toBe(true)
      expect(manager.isModuleExist(resolveFixtureFile('./unit-manager/b.yaml'))).toBe(false)
    })
  })
  describe('units', () => {
    test('return units', () => {
      let config = new Config({ configFile: resolveFixtureFile('./unit-manager/demo1/config.yaml') })
      let manager = new UnitManager(config)
      expect(manager.units()).toHaveLength(2)
      expect(manager.units()[0]).toBeInstanceOf(Unit)
    })
  })
})

function init(file = './unit-manager/empty/config.yaml') {
  let config = new Config({ configFile: resolveFixtureFile(file) })
  let manager = new UnitManager(config)
  return { config, manager }
}
