const Logger = require('../../src/logger')
const Config = require('../../src/config')
const UnitModule = require('../../src/unit-module')
const Unit = require('../../src/unit')
const { resolveFixtureFile } = require('./helper')
const utils = require('../../src/utils')

describe('Test UnitModule', () => {
  test('private property', () => {
    let { module, options, config, logger, manager } = init({
      file: resolveFixtureFile('./unit-module/module.yaml'),
      template: {
        units: [{ describe: 'feed', api: 'getFeed' }],
        dependencies: ['./module1.yaml']
      }
    })
    expect(module._file).toBe(options.file)
    expect(module._config).toBe(config)
    expect(module._logger).toBe(logger)
    expect(module._manager).toBe(manager)
    expect(module._name).toBe('module')
    expect(module._logger._title).toBe('module')
    expect(module._template).toBe(options.template)
    expect(module._dependencies).toEqual([{ name: 'module1', module: 'module1' }])
    expect(module._units).toHaveLength(1)
    expect(module._units[0]).toBeInstanceOf(Unit)
  })
})

describe('private function', () => {
  describe('_load', () => {
    test('should load object from yaml file', () => {
      let { module, logger } = init({
        file: resolveFixtureFile('./unit-module/module.yaml')
      })
      let result = module._load()
      expect(result).toEqual({ units: [] })
    })
    test('log error if file does not exist', () => {
      let { module, logger, file } = init({
        file: resolveFixtureFile('./unit-module/404.yaml')
      })
      let result = module._load()
      expect(result).toBeUndefined()
      expect(logger.toString()).toBe(`  404:
    fail to load or parse moudle file, ENOENT: no such file or directory, open '${file}'
`)
    })
    test('log error if file is not valid yaml file', () => {
      let { module, logger } = init({
        file: resolveFixtureFile('./unit-module/error.yaml')
      })
      let result = module._load()
      expect(result).toBeUndefined()
      expect(logger.toString()).toBe(`  error:
    fail to load or parse moudle file, unknown tag !<!badtag> at line 8, column 1:
        
        ^
`)
    })
  })
  describe('_absoluteFile', () => {
    test('file path is relative', () => {
      let { module } = init()
      let result = module._absoluteFile('./folder//module1.yaml')
      expect(result).toBe(resolveFixtureFile('./unit-module/folder/module1.yaml'))
    })
    test('file path is absolute', () => {
      let { module, logger } = init()
      let target = resolveFixtureFile('./moudle/module1.yaml')
      let result = module._absoluteFile(target)
      expect(result).toBe(target)
    })
  })
  describe('_moduleName', () => {
    test('file path is relative', () => {
      let { module, logger } = init({
        file: resolveFixtureFile('./unit-module/folder/module.yaml')
      })
      let result = module._moduleName('../module1.yaml')
      expect(result).toBe('module1')
    })
    test('file path is absolute', () => {
      let { module, logger } = init()
      let result = module._moduleName(resolveFixtureFile('./unit-module/folder/module1.yaml'))
      expect(result).toBe('folder-module1')
    })
  })
  describe('_parseDependencies', () => {
    test('should parse dependencies when value is array', () => {
      let { module, logger } = init()
      let target = ['./module1.yaml', { name: 'auth', module: './module2.yaml' }]
      let result = module._parseDependencies(target, logger)
      expect(result).toEqual([{ name: 'module1', module: 'module1' }, { name: 'auth', module: 'module2' }])
    })
    test('should parse dependencies when value is object', () => {
      let { module, logger } = init()
      let target = { auth: './module1.yaml', user: './module2.yaml' }
      let result = module._parseDependencies(target, logger)
      expect(result).toEqual([{ name: 'auth', module: 'module1' }, { name: 'user', module: 'module2' }])
    })
    test('return [] when there is no dependencies value', () => {
      let { module, logger } = init()
      let scopedLogger = logger.enter('dependencies')
      let result = module._parseDependencies(undefined, scopedLogger)
      expect(result).toEqual([])
    })
    test('log error when value is not object or undefined', () => {
      let { module, logger } = init()
      let scopedLogger = logger.enter('dependencies')
      let result = module._parseDependencies('abc', scopedLogger)
      expect(logger.toString()).toBe(`  module:
    dependencies:
      should be object or array
`)
    })
    test('omit invalid dependencies', () => {
      let { module, logger } = init()
      let target = [{ name: 'feed', module: './feed.yaml' }, { name: 'invalid' }]
      let scopedLogger = logger.enter('dependencies')
      let result = module._parseDependencies(target, scopedLogger)
      expect(result).toHaveLength(1)
      expect(logger.toString()).toBe(`  module:
    dependencies:
      [1]:
        module:
          required
`)
    })
    test('log error when there is conflicted names', () => {
      let { module, logger } = init()
      let target = [{ name: 'feed', module: './feed.yaml' }, { name: 'feed', module: './feed-auth.yaml' }]
      let scopedLogger = logger.enter('dependencies')
      let result = module._parseDependencies(target, scopedLogger)
      expect(logger.toString()).toBe(`  module:
    dependencies:
      must have no conflict names feed
`)
    })
  })
  describe('_parseDependency', () => {
    test('should parse dependency when value is string', () => {
      let { module, logger } = init()
      let target = './feed.yaml'
      let scopedLogger = logger.enter('dependencies').enter('[0]')
      let result = module._parseDependency(target, scopedLogger)
      expect(result).toEqual({ module: 'feed', name: 'feed' })
    })
    test('log error when value is not object or string', () => {
      let { module, logger } = init()
      let target = []
      let scopedLogger = logger.enter('dependencies').enter('[0]')
      let result = module._parseDependency(target, scopedLogger)
      expect(logger.toString()).toBe(`  module:
    dependencies:
      [0]:
        must be string or object
`)
    })
    test('log error if value is object and have no property module', () => {
      let { module, logger } = init()
      let target = { name: 'feed' }
      let scopedLogger = logger.enter('dependencies').enter('[0]')
      let result = module._parseDependency(target, scopedLogger)
      expect(logger.toString()).toBe(`  module:
    dependencies:
      [0]:
        module:
          required
`)
    })
    test('log error if dependency file doest not exist', () => {
      let { module, logger } = init({
        isModuleExist: () => false
      })
      let target = './feed.yaml'
      let scopedLogger = logger.enter('dependencies').enter('[0]')
      let result = module._parseDependency(target, scopedLogger)
      expect(logger.toString()).toBe(`  module:
    dependencies:
      [0]:
        cannot find dependency at ${resolveFixtureFile('/unit-module/feed.yaml')}
`)
    })
  })
  describe('_parseUnits', () => {
    test('should parse unit', () => {
      let { module, logger } = init()
      let target = [{ describe: 'feed', api: 'getFeed' }, { describe: 'article', api: 'getArticle' }]
      let scope = new UnitModule.Scope()
      let scopedLogger = logger.enter('units')
      let result = module._parseUnits(target, scopedLogger, scope)
      expect(result).toHaveLength(2)
    })
    test('log error when value is not array', () => {
      let { module, logger } = init()
      let target = {}
      let scope = new UnitModule.Scope()
      let scopedLogger = logger.enter('units')
      let result = module._parseUnits(target, scopedLogger, scope)
      expect(result).toEqual([])
      expect(logger.toString()).toBe(`  module:
    units:
      must be array
`)
    })
    test('omit invalid units', () => {
      let { module, logger } = init()
      let target = [{ describe: 'feed', api: 'getFeed' }, { api: 'getArticle' }]
      let scope = new UnitModule.Scope()
      let scopedLogger = logger.enter('units')
      let result = module._parseUnits(target, scopedLogger, scope)
      expect(result).toHaveLength(1)
    })
    test('flat when there is nested units', () => {
      let { module, logger } = init()
      let target = [
        {
          describe: 'group1',
          units: [{ describe: 'feed', api: 'getFeed' }, { describe: 'getArticle', api: 'getArticle' }]
        },
        {
          describe: 'group2',
          units: [{ describe: 'feed2', api: 'getFeed' }, { describe: 'getArticle2', api: 'getArticle' }]
        }
      ]
      let scope = new UnitModule.Scope()
      let scopedLogger = logger.enter('units')
      let result = module._parseUnits(target, scopedLogger, scope)
      expect(result).toHaveLength(4)
    })
  })
  describe('_parseUnit', () => {
    test('should parse unit', () => {
      let { module, logger } = init()
      let target = { describe: 'feed', api: 'getFeed' }
      let scope = new UnitModule.Scope()
      let scopedLogger = logger.enter('units').enter('[0]')
      let result = module._parseUnit(target, 0, scopedLogger, scope)
      expect(result).toBeInstanceOf(Unit)
      expect(result._scope._indexes).toEqual([0])
      expect(result._scope._describes).toEqual(['feed'])
      expect(scopedLogger._title).toBe('[0](feed)')
    })
    test('log error if value is not object', () => {
      let { module, logger } = init()
      let target = [{ describe: 'feed', api: 'getFeed' }]
      let scope = new UnitModule.Scope()
      let scopedLogger = logger.enter('units').enter('[0]')
      let result = module._parseUnit(target, 0, scopedLogger, scope)
      expect(result).toBeUndefined
      expect(logger.toString()).toBe(`  module:
    units:
      [0]:
        must be object
`)
    })
    test('log error when value have no property describe', () => {
      let { module, logger } = init()
      let target = { descripe: 'feed', api: 'getFeed' }
      let scope = new UnitModule.Scope()
      let scopedLogger = logger.enter('units').enter('[0]')
      let result = module._parseUnit(target, 0, scopedLogger, scope)
      expect(result).toBeUndefined
      expect(logger.toString()).toBe(`  module:
    units:
      [0]:
        describe:
          required
`)
    })
    test('unit group', () => {
      let { module, logger } = init()
      let target = { describe: 'group1', units: [{ describe: 'feed', api: 'getFeed' }] }
      let scope = new UnitModule.Scope()
      let scopedLogger = logger.enter('units').enter('[0]')
      let result = module._parseUnit(target, 0, scopedLogger, scope)
      expect(result).toHaveLength(1)
      expect(result[0]).toBeInstanceOf(Unit)
    })
  })
})
describe('public function', () => {
  describe('#valid', () => {
    test('return true when logger is clean', () => {
      let { module, logger } = init()
      expect(module.valid()).toBe(true)
    })
    test('return false when logger is dirty', () => {
      let { module, logger } = init()
      logger.log('dirty')
      expect(module.valid()).toBe(false)
    })
  })
  describe('#name', () => {
    test('return module name', () => {
      let { module } = init()
      expect(module.name()).toBe('module')
    })
  })
  describe('#dependencies', () => {
    test('return module dependencies', () => {
      let { module } = init({
        template: { units: [], dependencies: ['./module1.yaml'] }
      })
      expect(module.dependencies()).toEqual([{ name: 'module1', module: 'module1' }])
    })
  })
  describe('#units', () => {
    test('return parsed units', () => {
      let { module } = init({
        template: { units: [{ describe: 'feed', api: 'getFeed' }, { describe: 'article', api: 'getArticle' }] }
      })
      expect(module.units()).toHaveLength(2)
    })
  })
})

function init(options = {}) {
  let {
    file = resolveFixtureFile('./unit-module/module.yaml'),
    template = { units: [] },
    isModuleExist = () => true
  } = options
  let logger = new Logger('LoadUnits').enter(file)
  let config = new Config(resolveFixtureFile('./unit-module/config.yaml'))
  config.findAPI = v => ({ method: 'get', name: v, url: `http://localhost:3000/` + v })
  let manager = { isModuleExist }
  let loadYamlSyncOrigin = utils.loadYamlSync
  utils.loadYamlSync = jest.fn().mockImplementation(() => options.template)
  let module = new UnitModule(file, config, logger, manager)
  logger.tryThrow()
  utils.loadYamlSync = loadYamlSyncOrigin
  return { file, config, logger, manager, module, options }
}
