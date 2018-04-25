const Config = require('../../src/config')
const { resolveFixtureFile } = require('./helper')
const path = require('path')
const yaml = require('js-yaml')
const Logger = require('../../src/logger')
const fs = require('fs')

describe('Test Config', () => {
  let configFile = resolveFixtureFile('./config/realworld.yaml')
  let config = new Config(configFile)
  test('private property', () => {
    expect(config._file).toBe(configFile)
    expect(config._logger).toBeInstanceOf(Logger)
    expect(config._template).toEqual(require(resolveFixtureFile('./config/realworld.json')))
    expect(config._serializerM.names()).toEqual(['json'])
    expect(config._rootDir).toEqual(path.dirname(configFile))
    expect(config._sessionFile).toEqual('/tmp/realworld.session')
    expect(config._type).toEqual('json')
    expect(config._url).toBe('http://localhost:3000/api')
    expect(config._apis).toEqual(require(resolveFixtureFile('./config/realworld.api.json')))
    expect(config._variables).toEqual({})
    expect(config._plugins).toBeInstanceOf(Array)
  })
  test('throw error if file nonexist', () => {
    expect(() => new Config(resolveFixtureFile('./config/nofile.yaml'))).toThrow(/can not load config file/)
  })
})

describe('Test parse function', () => {
  afterAll(() => {
    try {
      fs.unlinkSync(resolveFixtureFile('./config/.session'))
    } catch (e) {}
  })
  describe('_parseRootDir', () => {
    test('default value is .', () => {
      let { config } = init()
      expect(config.rootDir()).toEqual(resolveFixtureFile('./config'))
    })
    test('work on relative path', () => {
      let { config, logger } = init()
      let rootDir = config._parseRootDir('.', logger)
      expect(rootDir).toEqual(resolveFixtureFile('./config'))
    })
    test('work on absolute path', () => {
      let { config, logger } = init()
      let rootDir = config._parseRootDir('/tmp', logger)
      expect(rootDir).toEqual('/tmp')
    })
    test('log error when directory not found', () => {
      let { config, logger } = init()
      let rootDir = config._parseRootDir('./nonexist', logger)
      expect(rootDir).toBeUndefined()
      expect(logger.toString()).toMatch('must be valid directory at')
    })
  })
  describe('_parseSessionFile', () => {
    function deleteSessionFile() {
      try {
        fs.unlinkSync(resolveFixtureFile('./config/mysession'))
      } catch (e) {}
      try {
        fs.unlinkSync(resolveFixtureFile('/tmp/mysession'))
      } catch (e) {}
    }
    beforeAll(() => {
      deleteSessionFile()
      fs.writeFileSync(resolveFixtureFile('./config/mysession'), '')
    })
    afterAll(() => {
      deleteSessionFile()
    })
    test('default value is .session', () => {
      let { config } = init()
      expect(config.sessionFile()).toEqual(resolveFixtureFile('./config/.session'))
    })
    test('work on relative path', () => {
      let { config, logger } = init()
      let sessionFile = config._parseSessionFile('./mysession', logger)
      expect(sessionFile).toEqual(resolveFixtureFile('./config/mysession'))
    })
    test('work on absolute path', () => {
      let { config, logger } = init()
      let sessionFile = config._parseSessionFile('/tmp/mysession', logger)
      expect(sessionFile).toEqual('/tmp/mysession')
    })
    test('create session file if nonexist', () => {
      let { config, logger } = init()
      expect(fs.existsSync('/tmp/mysession')).toBe(true)
    })
    test('log error if cannot create session file', () => {
      let { config, logger } = init()
      let sessionFile = config._parseSessionFile('/dev', logger)
      expect(sessionFile).toBeUndefined()
      expect(logger.toString()).toMatch(/must be valid file at/)
    })
  })
  describe('_parseType', () => {
    test('default value is json', () => {
      let { config } = init()
      expect(config._type).toBe('json')
    })
    test('log error if type unregisted', () => {
      let { config, logger } = init()
      let type = config._parseType('xml', logger)
      expect(type).toBeUndefined()
      expect(logger.toString()).toMatch(/must be one of/)
    })
  })
  describe('_parseTimeout', () => {
    test('default value is 1000', () => {
      let { config } = init()
      expect(config._timeout).toBe(1000)
    })
    test('log error if timeout is not integer', () => {
      let { config, logger } = init()
      let type = config._parseTimeout('300', logger)
      expect(type).toBeUndefined()
      expect(logger.toString()).toMatch(/must be integer/)
    })
  })
  describe('_parseUrl', () => {
    test('default value is http://localhost:3000', () => {
      let { config } = init()
      expect(config._url).toBe('http://localhost:3000')
    })
    test('append http:// when protocol omitted', () => {
      let { config, logger } = init()
      let url = config._parseUrl('localhost:3000', logger)
      expect(url).toBe('http://localhost:3000')
    })
    test('log error when url invalid', () => {
      let { config, logger } = init()
      let url = config._parseUrl('ws://localhost', logger)
      expect(url).toBeUndefined()
      expect(logger.toString()).toMatch(/must be valid web url/)
    })
  })
  describe('_parseAPIs', () => {
    test('default value is []', () => {
      let { config } = init()
      expect(config._apis).toEqual([])
    })
    test('log error when url wrong', () => {
      let { config, logger } = init()
      config._url = undefined
      let apis = config._parseAPIs({ feed: '/feed' }, logger)
      expect(apis).toEqual([])
      expect(logger.toString()).toMatch(/cannot parse apis because url is not correct/)
    })
    test('log error when yaml value of apis is not object or array', () => {
      let { config, logger } = init()
      let apis = config._parseAPIs('/feed', logger)
      expect(logger.toString()).toMatch(/must be array or object/)
    })
    test('log error when name conflicted', () => {
      let { config, logger } = init()
      let value = [{ name: 'feed', uri: '/feed', method: 'post' }, { name: 'feed', uri: '/feed', method: 'get' }]
      let apis = config._parseAPIs(value, logger)
      expect(logger.toString()).toMatch(/name conflict/)
    })
    test('work when value of apis is array', () => {
      let { config, logger } = init()
      let value = [
        { name: 'createFeed', uri: '/feed', method: 'post' },
        { name: 'getFeed', uri: '/feed', method: 'get' }
      ]
      let apis = config._parseAPIs(value, logger)
      expect(apis).toEqual([
        {
          keys: [],
          method: 'post',
          name: 'createFeed',
          url: 'http://localhost:3000/feed',
          timeout: 1000,
          type: 'json'
        },
        { keys: [], method: 'get', name: 'getFeed', url: 'http://localhost:3000/feed', timeout: 1000, type: 'json' }
      ])
    })
    test('work when value of apis is object', () => {
      let { config, logger } = init()
      let value = {
        createFeed: { uri: '/feed', method: 'post' },
        getFeed: '/feed'
      }
      let apis = config._parseAPIs(value, logger)
      expect(apis).toEqual([
        {
          keys: [],
          method: 'post',
          name: 'createFeed',
          url: 'http://localhost:3000/feed',
          timeout: 1000,
          type: 'json'
        },
        { keys: [], method: 'get', name: 'getFeed', url: 'http://localhost:3000/feed', timeout: 1000, type: 'json' }
      ])
    })
    test('filter out the invalid api', () => {
      let { config, logger } = init()
      let value = [
        { name: 'createFeed', uri: '/feed', method: 'pst' },
        { name: 'getFeed', uri: '/feed', method: 'get' }
      ]
      let apis = config._parseAPIs(value, logger)

      expect(apis).toEqual([
        {
          keys: [],
          method: 'get',
          name: 'getFeed',
          url: 'http://localhost:3000/feed',
          timeout: 1000,
          type: 'json'
        }
      ])
      expect(logger.dirty()).toBe(true)
    })
  })
  describe('_parseAPIsObject', () => {
    test('value can be string', () => {
      let { config, logger } = init()
      let value = { getFeed: '/feed' }
      let apis = config._parseAPIsObject(value, logger)
      expect(apis).toEqual([{ name: 'getFeed', uri: '/feed' }])
    })
    test('value can be object', () => {
      let { config, logger } = init()
      let value = { getFeed: { uri: '/feed', method: 'post' } }
      let apis = config._parseAPIsObject(value, logger)
      expect(apis).toEqual([{ name: 'getFeed', uri: '/feed', method: 'post' }])
    })
    test('need property uri when value is object', () => {
      let { config, logger } = init()
      let value = { getFeed: { url: '/feed', method: 'post' } }
      let apis = config._parseAPIsObject(value, logger)
      expect(logger.toString()).toMatch('must be object have property uri')
    })
    test('log error when value is not string or object', () => {
      let { config, logger } = init()
      let value = { getFeed: null }
      let apis = config._parseAPIsObject(value, logger)
      expect(logger.toString()).toMatch('must be string or object')
    })
    test('omit wrong api', () => {
      let { config, logger } = init()
      let value = { createFeed: { uri: '/feed', method: 'post' }, listFeed: null }
      let apis = config._parseAPIsObject(value, logger)
      expect(apis).toEqual([{ name: 'createFeed', uri: '/feed', method: 'post' }])
    })
  })
  describe('_parseAPIsArray', () => {
    test('elem must be object', () => {
      let { config, logger } = init()
      let value = ['/feed']
      let apis = config._parseAPIsArray(value, logger)
      expect(logger.toString()).toMatch(/must be object/)
    })
    test('elem need property name', () => {
      let { config, logger } = init()
      let value = [{ uri: '/feed' }]
      let apis = config._parseAPIsArray(value, logger)
      expect(logger.toString()).toMatch(/must have property name/)
    })
    test('elem need property uri', () => {
      let { config, logger } = init()
      let value = [{ name: 'getFeed' }]
      let apis = config._parseAPIsArray(value, logger)
      expect(logger.toString()).toMatch(/must have property uri/)
    })
    test('omit wrong api', () => {
      let { config, logger } = init()
      let value = [{ name: 'getFeed' }, { name: 'createFeed', uri: '/feed', method: 'post' }]
      let apis = config._parseAPIsArray(value, logger)
      expect(apis).toEqual([{ name: 'createFeed', uri: '/feed', method: 'post' }])
    })
  })
  describe('_modifyAPI', () => {
    test('default value of property method is get', () => {
      let { config, logger } = init()
      let value = { name: 'getFeed', uri: '/feed' }
      let api = config._modifyAPI(value, logger)
      expect(api.method).toEqual('get')
    })
    test('append global url if uri is relative', () => {
      let { config, logger } = init()
      let value = { name: 'getFeed', uri: '/feed' }
      let api = config._modifyAPI(value, logger)
      expect(api.url).toEqual(config._url + value.uri)
    })
    test('log error if uri invalid', () => {
      let { config, logger } = init()
      let value = { name: 'getFeed', uri: 'feed' }
      let api = config._modifyAPI(value, logger)
      expect(logger.toString()).toMatch('invalid url at')
    })
    test('custom timeout', () => {
      let { config, logger } = init()
      let value = { name: 'getFeed', uri: '/feed', timeout: 500 }
      let api = config._modifyAPI(value, logger)
      expect(api.timeout).toEqual(500)
    })
    test('log error custom type unregisted', () => {
      let { config, logger } = init()
      let value = { name: 'getFeed', uri: '/feed', type: 'xml' }
      let api = config._modifyAPI(value, logger)
      expect(logger.toString()).toMatch('must be one of')
      expect(api).toBeUndefined()
    })
    test('have computed property keys', () => {
      let { config, logger } = init()
      let value = { name: 'getComment', uri: '/articles/{slug}/comments/{id}' }
      let api = config._modifyAPI(value, logger)
      expect(api.keys).toEqual(['id', 'slug'])
    })
    test('log error when method is not valid http method', () => {
      let { config, logger } = init()
      let value = { name: 'getFeed', uri: '/feed', method: 'pst' }
      let api = config._modifyAPI(value, logger)
      expect(logger.toString()).toMatch(/invalid http method/)
    })
  })
  describe('_parseVariables', () => {
    test('should work', () => {
      let { config, logger } = init()
      let value = {}
      let variables = config._parseVariables(value, logger)
      expect(variables).toBe(value)
    })
    test('log error when variables is not object or undefined', () => {
      let { config, logger } = init()
      let value = null
      let variables = config._parseVariables(value, logger)
      expect(logger.toString()).toMatch(/must be object/)
    })
  })
  describe('_parsePlugins', () => {
    test('should work', () => {
      let { config, logger } = init()
      let result = config._parsePlugins([resolveFixtureFile('./config/plugin-test1')], logger)
      expect(result).toContainEqual('!$test1')
      expect(result).toContainEqual('!@test1')
    })
    test('log error when plugins is not array or undefined', () => {
      let { config, logger } = init()
      let result = config._parsePlugins({}, logger)
      expect(logger.toString()).toMatch('must be array')
    })
    test('log error if plugin file cannot be required', () => {
      let { config, logger } = init()
      let result = config._parsePlugins([resolveFixtureFile('./config/plugin-notfind')], logger)
      expect(logger.toString()).toMatch('cannot load plugin')
    })
    test('log error if plugin model is not object', () => {
      let { config, logger } = init()
      let result = config._parsePlugins([resolveFixtureFile('./config/plugin-test2')], logger)
      expect(logger.toString()).toMatch('must be object have property differ or resolver')
    })
    test('log error if no plugin registed', () => {
      let { config, logger } = init()
      let result = config._parsePlugins([resolveFixtureFile('./config/plugin-test3')], logger)
      expect(logger.toString()).toMatch('cannot regist any plugin')
    })
  })
  describe('_loadPlugins', () => {
    test('should work', () => {
      let { config, logger } = init()
      let resolver = [{ name: 'test', kind: 'scalar', handler: jest.fn() }]
      let result = config._loadPlugins('resolver', resolver, logger)
      expect(result).toBe(true)
      expect(config._pluginM.names()).toContain('!$test')
    })
    test('log error if plugins is not array or undefined', () => {
      let { config, logger } = init()
      let result = config._loadPlugins('resolver', {}, logger)
      expect(result).not.toBe(true)
      expect(logger.toString()).toMatch('must be array')
    })
    test('break if plugins is not array', () => {
      let { config, logger } = init()
      let result = config._loadPlugins('resolver', undefined, logger)
      expect(result).not.toBe(true)
      expect(logger.dirty()).toBe(false)
    })
    test('log error if a plugin is not object', () => {
      let { config, logger } = init()
      let resolver = [() => ({})]
      let result = config._loadPlugins('resolver', resolver, logger)
      expect(result).not.toBe(true)
      expect(logger.toString()).toMatch('must be object')
    })
    test('log error if fail to regist', () => {
      let { config, logger } = init()
      let resolver = [{ name: 'test1' }]
      let result = config._loadPlugins('resolver', resolver, logger)
      expect(result).not.toBe(true)
      expect(logger.toString()).toMatch('cannot regist plugin')
    })
  })
})

describe('public functions', () => {
  let configFile = resolveFixtureFile('./config/realworld.yaml')
  let config = new Config(configFile)
  describe('#file', () => {
    test('return config file absolute path', () => {
      expect(config.file()).toBe(configFile)
    })
  })
  describe('#rootDir', () => {
    test('return project root dir', () => {
      expect(config.rootDir()).toBe(path.dirname(configFile))
    })
  })
  describe('#sessionFile', () => {
    test('return session file path', () => {
      expect(config.sessionFile()).toEqual('/tmp/realworld.session')
    })
  })
  describe('#variables', () => {
    test('return global variables', () => {
      expect(config.variables()).toEqual({})
    })
  })
  describe('#findAPI', () => {
    test('return api if find', () => {
      expect(config.findAPI('deleteComment')).toEqual({
        keys: ['id', 'slug'],
        method: 'delete',
        name: 'deleteComment',
        url: 'http://localhost:3000/api/articles/{slug}/comments/{id}',
        timeout: 1000,
        type: 'json'
      })
    })
    test('return undefined if not find', () => {
      expect(config.findAPI('delComment')).toBeUndefined()
    })
  })
  describe('#findSerializer', () => {
    test('return default type', () => {
      expect(config.findSerializer().name).toBe(config._type)
    })
    test('can find by name', () => {
      expect(config.findSerializer('json').name).toBe(config._type)
    })
    test('can find by type', () => {
      expect(config.findSerializer('application/json').name).toBe(config._type)
    })
    test('return undefined if not find', () => {
      expect(config.findSerializer('xml')).toBeUndefined()
    })
  })
  describe('#schema', () => {
    test('return yaml.Schema', () => {
      expect(config.schema()).toBeInstanceOf(yaml.Schema)
    })
    test('use cache when call again', () => {
      let schema = config.schema()
      expect(config.schema()).toBe(schema)
    })
  })
})

function init() {
  let config = new Config(resolveFixtureFile('./config/empty.yaml'))
  let logger = new Logger()
  return { config, logger }
}
