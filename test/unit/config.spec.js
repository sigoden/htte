const Config = require('../../src/config')
const PluginManager = require('../../src/plugin-manager')
const SerializerManager = require('../../src/serializer-manager')
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
    expect(config._serializerM.names()).toEqual(['json', 'xml'])
    expect(config._rootDir).toEqual(path.dirname(configFile))
    expect(config._sessionFile).toEqual('/tmp/realworld.session')
    expect(config._type).toEqual('json')
    expect(config._url).toBe('http://localhost:3000/api')
    expect(config._apis).toEqual(require(resolveFixtureFile('./config/realworld.api.json')))
    expect(config._exports).toEqual({})
    expect(config._plugins).toBeInstanceOf(Array)
    expect(config._serializers).toBeInstanceOf(Array)
  })
  test('throw error if file does not exist', () => {
    expect(() => new Config(resolveFixtureFile('./config/404.yaml'))).toThrow(/can not load config file/)
  })
  test('init without config file', () => {
    let config = new Config()
    let configFile = path.resolve('.yaml')
    expect(config._file).toBe(configFile)
    expect(config._logger).toBeInstanceOf(Logger)
    expect(config._template).toEqual({
      rootDir: '.',
      sessionFile: config._sessionFile,
      type: 'json',
      timeout: 3000,
      url: 'http://localhost:3000',
      apis: {},
      exports: {},
      plugins: [],
      serializers: []
    })
    expect(config._serializerM.names()).toEqual(['json', 'xml'])
    expect(config._rootDir).toEqual(path.dirname(configFile))
    expect(config._sessionFile).toMatch(/^\/tmp\/htte-session-\w{32}\.json$/)
    expect(config._type).toEqual('json')
    expect(config._url).toBe('http://localhost:3000')
    expect(config._apis).toEqual([])
    expect(config._exports).toEqual({})
    expect(config._plugins).toBeInstanceOf(Array)
    expect(config._serializers).toBeInstanceOf(Array)
  })
})

describe('Test parse function', () => {
  describe('_parseRootDir', () => {
    test('return directory which contains config file when omitted', () => {
      let { config } = init()
      expect(config.rootDir()).toEqual(resolveFixtureFile('./config'))
    })
    test('should work when rootDir is relative path', () => {
      let { config, logger } = init()
      let rootDir = config._parseRootDir('.', logger)
      expect(rootDir).toEqual(resolveFixtureFile('./config'))
    })
    test('should work when rootDir is absolute path', () => {
      let { config, logger } = init()
      let rootDir = config._parseRootDir('/tmp', logger)
      expect(rootDir).toEqual('/tmp')
    })
    test('log error when directory does not exist', () => {
      let { config, logger } = init()
      let scopedLogger = logger.enter('rootDir')
      let rootDir = config._parseRootDir('./404', scopedLogger)
      expect(rootDir).toBeUndefined()
      expect(scopedLogger.toString()).toBe(`  rootDir:
    must be valid directory at ./404
`)
    })
  })
  describe('_parseSessionFile', () => {
    function deleteSessionFile() {
      let files = ['./config/mysession', '/tmp/mysession', '/tmp/mysession2']
      files.forEach(file => {
        try {
          fs.unlinkSync(resolveFixtureFile(file))
        } catch (e) {}
      })
    }
    beforeAll(() => {
      deleteSessionFile()
    })
    afterAll(() => {
      deleteSessionFile()
    })
    test('return file named .session and stored in same directory of config file when omitted ', () => {
      let { config } = init()
      expect(config.sessionFile()).toMatch(/^\/tmp\/htte-session-\w{32}\.json$/)
    })
    test('should work when sessionFile is relative path', () => {
      let { config, logger } = init()
      let scopedLogger = logger.enter('sessionFile')
      let sessionFile = config._parseSessionFile('./mysession', scopedLogger)
      expect(sessionFile).toEqual(resolveFixtureFile('./config/mysession'))
    })
    test('should work when sessionFile is absolute path', () => {
      let { config, logger } = init()
      let scopedLogger = logger.enter('sessionFile')
      let sessionFile = config._parseSessionFile('/tmp/mysession', scopedLogger)
      expect(sessionFile).toEqual('/tmp/mysession')
    })
    test('should work if file does not exist but can be created', () => {
      let { config, logger } = init()
      let scopedLogger = logger.enter('sessionFile')
      let sessionFile = config._parseSessionFile('/tmp/mysession2', scopedLogger)
      expect(fs.existsSync('/tmp/mysession2')).toBe(true)
    })
    test('log error if file does not exists nor can not be created', () => {
      let { config, logger } = init()
      let scopedLogger = logger.enter('sessionFile')
      let sessionFile = config._parseSessionFile('/dev', scopedLogger)
      expect(sessionFile).toBeUndefined()
      expect(scopedLogger.toString()).toBe(`  sessionFile:
    must be valid file at /dev, EISDIR: illegal operation on a directory, open '/dev'
`)
    })
  })
  describe('_parseType', () => {
    test('return json when omitted', () => {
      let { config } = init()
      expect(config._type).toBe('json')
    })
    test('log error if type of serializer unregisted', () => {
      let { config, logger } = init()
      let scopedLogger = logger.enter('type')
      let type = config._parseType('exe', scopedLogger)
      expect(type).toBeUndefined()
      expect(scopedLogger.toString()).toBe(`  type:
    must be one of json,xml
`)
    })
  })
  describe('_parseTimeout', () => {
    test('return 1000 when omitted', () => {
      let { config } = init()
      expect(config._timeout).toBe(3000)
    })
    test('log error if timeout is not integer', () => {
      let { config, logger } = init()
      let scopedLogger = logger.enter('timeout')
      let timeout = config._parseTimeout('300', scopedLogger)
      expect(timeout).toBeUndefined()
      expect(scopedLogger.toString()).toBe(`  timeout:
    must be integer
`)
    })
  })
  describe('_parseUrl', () => {
    test('return http://localhost:3000 when omitted', () => {
      let { config } = init()
      expect(config._url).toBe('http://localhost:3000')
    })
    test('append "http://" if url had no protocol', () => {
      let { config, logger } = init()
      let scopedLogger = logger.enter('url')
      let url = config._parseUrl('localhost:3000', scopedLogger)
      expect(url).toBe('http://localhost:3000')
    })
    test('log error if url is not valid', () => {
      let { config, logger } = init()
      let scopedLogger = logger.enter('url')
      let url = config._parseUrl('ws://localhost', scopedLogger)
      expect(url).toBeUndefined()
      expect(scopedLogger.toString()).toBe(`  url:
    must be valid web url, not ws://localhost
`)
    })
  })
  describe('_parseAPIs', () => {
    test('return [] when omitted', () => {
      let { config } = init()
      expect(config._apis).toEqual([])
    })
    test('return [] when url is not valid', () => {
      let { config, logger } = init()
      config._url = undefined
      let scopedLogger = logger.enter('apis')
      let apis = config._parseAPIs({ feed: '/feed' }, scopedLogger)
      expect(apis).toEqual([])
      expect(scopedLogger.dirty()).toBe(false)
    })
    test('log error when `apis` is not valid', () => {
      let { config, logger } = init()
      let scopedLogger = logger.enter('apis')
      let apis = config._parseAPIs('/feed', scopedLogger)
      expect(scopedLogger.toString()).toBe(`  apis:
    must be array or object
`)
    })
    test('log error when name conflict', () => {
      let { config, logger } = init()
      let value = [{ name: 'feed', uri: '/feed', method: 'post' }, { name: 'feed', uri: '/feed', method: 'get' }]
      let scopedLogger = logger.enter('apis')
      let apis = config._parseAPIs(value, scopedLogger)
      expect(scopedLogger.toString()).toBe(`  apis:
    must have no conflict names feed
`)
    })
    test('should work when apis is array', () => {
      let { config, logger } = init()
      let value = [
        { name: 'createFeed', uri: '/feed', method: 'post' },
        { name: 'getFeed', uri: '/feed', method: 'get' }
      ]
      let scopedLogger = logger.enter('apis')
      let apis = config._parseAPIs(value, scopedLogger)
      expect(apis).toEqual([
        {
          keys: [],
          method: 'post',
          name: 'createFeed',
          url: 'http://localhost:3000/feed',
          timeout: 3000,
          type: 'json'
        },
        { keys: [], method: 'get', name: 'getFeed', url: 'http://localhost:3000/feed', timeout: 3000, type: 'json' }
      ])
    })
    test('should work when apis is object', () => {
      let { config, logger } = init()
      let value = {
        createFeed: { uri: '/feed', method: 'post' },
        getFeed: '/feed'
      }
      let scopedLogger = logger.enter('apis')
      let apis = config._parseAPIs(value, scopedLogger)
      expect(apis).toEqual([
        {
          keys: [],
          method: 'post',
          name: 'createFeed',
          url: 'http://localhost:3000/feed',
          timeout: 3000,
          type: 'json'
        },
        { keys: [], method: 'get', name: 'getFeed', url: 'http://localhost:3000/feed', timeout: 3000, type: 'json' }
      ])
    })
    test('filter out the invalid APIObject', () => {
      let { config, logger } = init()
      let value = [
        { name: 'createFeed', uri: '/feed', method: 'pst' },
        { name: 'getFeed', uri: '/feed', method: 'get' }
      ]
      let scopedLogger = logger.enter('apis')
      let apis = config._parseAPIs(value, scopedLogger)

      expect(apis).toEqual([
        {
          keys: [],
          method: 'get',
          name: 'getFeed',
          url: 'http://localhost:3000/feed',
          timeout: 3000,
          type: 'json'
        }
      ])
      expect(scopedLogger.dirty()).toBe(true)
    })
  })
  describe('_parseAPIsObject', () => {
    test('should work when api is string', () => {
      let { config, logger } = init()
      let value = { getFeed: '/feed' }
      let scopedLogger = logger.enter('apis')
      let apis = config._parseAPIsObject(value, scopedLogger)
      expect(apis).toEqual([{ name: 'getFeed', uri: '/feed' }])
    })
    test('should work when api is object', () => {
      let { config, logger } = init()
      let value = { getFeed: { uri: '/feed', method: 'post' } }
      let scopedLogger = logger.enter('apis')
      let apis = config._parseAPIsObject(value, scopedLogger)
      expect(apis).toEqual([{ name: 'getFeed', uri: '/feed', method: 'post' }])
    })
    test('log error if api is object but have no property uri', () => {
      let { config, logger } = init()
      let value = { getFeed: { url: '/feed', method: 'post' } }
      let scopedLogger = logger.enter('apis')
      let apis = config._parseAPIsObject(value, scopedLogger)
      expect(scopedLogger.toString()).toBe(`  apis:
    getFeed:
      must be object with property uri
`)
    })
    test('log error when api is not string nor object', () => {
      let { config, logger } = init()
      let value = { getFeed: null }
      let scopedLogger = logger.enter('apis')
      let apis = config._parseAPIsObject(value, scopedLogger)
      expect(scopedLogger.toString()).toBe(`  apis:
    getFeed:
      must be string or object
`)
    })
    test('should filter out invalid APIObjects', () => {
      let { config, logger } = init()
      let value = { createFeed: { uri: '/feed', method: 'post' }, listFeed: null }
      let scopedLogger = logger.enter('apis')
      let apis = config._parseAPIsObject(value, scopedLogger)
      expect(apis).toEqual([{ name: 'createFeed', uri: '/feed', method: 'post' }])
      expect(scopedLogger.dirty()).toBe(true)
    })
  })
  describe('_parseAPIsArray', () => {
    test('log error if any element is not object', () => {
      let { config, logger } = init()
      let value = ['/feed']
      let scopedLogger = logger.enter('apis')
      let apis = config._parseAPIsArray(value, scopedLogger)
      expect(scopedLogger.toString()).toBe(`  apis:
    [0]:
      must be object
`)
    })
    test('log error if any element has no property name', () => {
      let { config, logger } = init()
      let value = [{ uri: '/feed' }]
      let scopedLogger = logger.enter('apis')
      let apis = config._parseAPIsArray(value, scopedLogger)
      expect(scopedLogger.toString()).toBe(`  apis:
    [0]:
      name:
        required
`)
    })
    test('log error if any element have no property uri', () => {
      let { config, logger } = init()
      let value = [{ name: 'getFeed' }]
      let scopedLogger = logger.enter('apis')
      let apis = config._parseAPIsArray(value, scopedLogger)
      expect(scopedLogger.toString()).toBe(`  apis:
    [0](getFeed):
      uri:
        required
`)
    })
    test('filter out invalid APIObjects', () => {
      let { config, logger } = init()
      let value = [{ name: 'getFeed' }, { name: 'createFeed', uri: '/feed', method: 'post' }]
      let scopedLogger = logger.enter('apis')
      let apis = config._parseAPIsArray(value, scopedLogger)
      expect(apis).toEqual([{ name: 'createFeed', uri: '/feed', method: 'post' }])
      expect(scopedLogger.dirty()).toBe(true)
    })
  })
  describe('_parseExports', () => {
    test('should return {} when omitted', () => {
      let { config, logger } = init()
      let value = {}
      let exportsData = config._parseExports(value, logger)
      expect(exportsData).toBe(value)
    })
    test('log error when exports is not object', () => {
      let { config, logger } = init()
      let value = null
      let scopedLogger = logger.enter('exports')
      let exportsData = config._parseExports(value, scopedLogger)
      expect(scopedLogger.toString()).toBe(`  exports:
    must be object
`)
    })
  })
  describe('_parsePlugins', () => {
    test('should regist plugins and return names of registed plugins', () => {
      let { config, logger } = init()
      let scopedLogger = logger.enter('plugins')
      let result = config._parsePlugins([resolveFixtureFile('./config/plugin-test1')], scopedLogger)
      expect(result).toContainEqual('!$test1')
      expect(result).toContainEqual('!@test1')
    })
    test('log error when plugins is not array', () => {
      let { config, logger } = init()
      let scopedLogger = logger.enter('plugins')
      let result = config._parsePlugins({}, scopedLogger)
      expect(scopedLogger.toString()).toBe(`  plugins:
    must be array
`)
    })
    test('log error when module of plugin cannot be required', () => {
      let { config, logger } = init()
      config._pluginM = PluginManager()
      let scopedLogger = logger.enter('plugins')
      let pluginPath = resolveFixtureFile('./config/plugin-404')
      let result = config._parsePlugins([pluginPath], scopedLogger)
      expect(scopedLogger.toString()).toBe(`  plugins:
    ${pluginPath}:
      cannot be loaded as module
`)
    })
    test('log error when module of plugin is not object', () => {
      let { config, logger } = init()
      config._pluginM = PluginManager()
      let scopedLogger = logger.enter('plugins')
      let pluginPath = resolveFixtureFile('./config/plugin-test2')
      let result = config._parsePlugins([pluginPath], scopedLogger)
      expect(scopedLogger.toString()).toBe(`  plugins:
    ${pluginPath}:
      must be object
`)
    })
  })
  describe('_registPlugins', () => {
    test('should regist plugins', () => {
      let { config, logger } = init()
      let resolver = [{ name: 'test', kind: 'scalar', handler: jest.fn() }]
      let scopedLogger = logger.enter('plugins').enter('/tmp/plugins')
      let result = config._registPlugins('resolver', resolver, scopedLogger)
      expect(config._pluginM.names()).toContain('!$test')
    })
    test('log error if plugins is not array or undefined', () => {
      let { config, logger } = init()
      let scopedLogger = logger.enter('plugins').enter('htte-plugin-faker')
      let result = config._registPlugins('resolver', {}, scopedLogger)
      expect(scopedLogger.toString()).toBe(`    htte-plugin-faker:
      must be array
`)
    })
    test('should work if plugins is undefined', () => {
      let { config, logger } = init()
      let scopedLogger = logger.enter('plugins').enter('htte-plugin-faker')
      let result = config._registPlugins('resolver', undefined, scopedLogger)
      expect(scopedLogger.dirty()).toBe(false)
    })
    test('log error if element is not object', () => {
      let { config, logger } = init()
      let resolver = [() => ({})]
      let scopedLogger = logger.enter('plugins').enter('htte-plugin-faker')
      let result = config._registPlugins('resolver', resolver, scopedLogger)
      expect(scopedLogger.toString()).toBe(`    htte-plugin-faker:
      [0]:
        must be object
`)
    })
    test('log error if element failed to regist', () => {
      let { config, logger } = init()
      let resolver = [{ name: 'test1' }]
      let scopedLogger = logger.enter('plugins').enter('htte-plugin-faker')
      let result = config._registPlugins('resolver', resolver, scopedLogger)
      expect(scopedLogger.toString()).toBe(`    htte-plugin-faker:
      [0]:
        test1: kind must be one of mapping,sequence,scalar
`)
    })
  })
  describe('_parseSerializers', () => {
    test('should regist serializers', () => {
      let { config, logger } = init()
      config._serializerM = SerializerManager()
      let serializerPath = resolveFixtureFile('./config/serializer-test1.js')
      let scopedLogger = logger.enter('serializers')
      let result = config._parseSerializers([serializerPath], scopedLogger)
      expect(result).toContainEqual('test1')
    })
    test('pass builtin serializer options', () => {
      let { config, logger } = init()
      config._serializerM = SerializerManager()
      let scopedLogger = logger.enter('serializers')
      let value = [{ module: 'htte-serializers-xml', options: { serializer: { ignoreAttributes: true } } }]
      let result = config._parseSerializers(value, scopedLogger)
      expect(result).toEqual(['xml', 'json'])
    })
    test('log error when serializers is not array or undefined', () => {
      let { config, logger } = init()
      config._serializerM = SerializerManager()
      let scopedLogger = logger.enter('serializers')
      let result = config._parseSerializers({}, scopedLogger)
      expect(scopedLogger.toString()).toBe(`  serializers:
    must be array
`)
    })
    test('log error if module cannot be required', () => {
      let { config, logger } = init()
      config._serializerM = SerializerManager()
      let serializerPath = resolveFixtureFile('./config/serializer-404')
      let scopedLogger = logger.enter('serializers')
      let result = config._parseSerializers([serializerPath], scopedLogger)
      expect(scopedLogger.toString()).toBe(`  serializers:
    ${serializerPath}:
      cannot be loaded as module
`)
    })
    test('log error if module item is invalid', () => {
      let { config, logger } = init()
      config._serializerM = SerializerManager()
      let scopedLogger = logger.enter('serializers')
      let result = config._parseSerializers([{}], scopedLogger)
      expect(scopedLogger.toString()).toBe(`  serializers:
    [0]:
      module:
        required
`)
    })
    test('log error if module failed to regist', () => {
      let { config, logger } = init()
      config._serializerM = SerializerManager()
      let serializerPath = resolveFixtureFile('./config/serializer-test1')
      let scopedLogger = logger.enter('serializers')
      let result = config._parseSerializers([serializerPath, serializerPath], scopedLogger)
      expect(scopedLogger.toString()).toBe(`  serializers:
    ${serializerPath}:
      test1: serializer conflict
`)
    })
  })
  describe('_parseSerializerItem', () => {
    test('should wrap to object if item is string', () => {
      let { config, logger } = init()
      config._serializerM = SerializerManager()
      let scopedLogger = logger.enter('serializer', '[0]')
      let item = 'path'
      expect(config._parseSerializerItem(item, scopedLogger)).toEqual({ module: item, options: {} })
    })
    test('should return object if item is object', () => {
      let { config, logger } = init()
      config._serializerM = SerializerManager()
      let scopedLogger = logger.enter('serializers', '[0]')
      let item = { module: 'path', options: { serializer: {} }, extra: {} }
      let result = { module: 'path', options: { serializer: {} } }
      expect(config._parseSerializerItem(item, scopedLogger)).toEqual(result)
      let item2 = { module: 'path' }
      let result2 = { module: 'path', options: {} }
      expect(config._parseSerializerItem(item2, scopedLogger)).toEqual(result2)
    })
    test('log error if item is not string nor object', () => {
      let { config, logger } = init()
      config._serializerM = SerializerManager()
      let scopedLogger = logger.enter('serializers')
      expect(config._parseSerializerItem([], scopedLogger.enter('[0]'))).toBeUndefined()
      expect(scopedLogger.toString()).toBe(`  serializers:
    [0]:
      must be string or object
`)
    })
    test('log error if item have no property module', () => {
      let { config, logger } = init()
      config._serializerM = SerializerManager()
      let scopedLogger = logger.enter('serializers')
      expect(config._parseSerializerItem({ options: {} }, scopedLogger.enter('[0]'))).toBeUndefined()
      expect(scopedLogger.toString()).toBe(`  serializers:
    [0]:
      module:
        required
`)
    })
    test('log error if item have property options but invalid', () => {
      let { config, logger } = init()
      config._serializerM = SerializerManager()
      let scopedLogger = logger.enter('serializers')
      expect(config._parseSerializerItem({ module: 'path', options: 'abc' }, scopedLogger.enter('[0]'))).toBeUndefined()
      expect(scopedLogger.toString()).toBe(`  serializers:
    [0]:
      options:
        must be object
`)
    })
    test('special proc on builtin serializer', () => {
      let { config, logger } = init()
      config._serializerM = SerializerManager()
      let scopedLogger = logger.enter('serializers')
      let item = { module: 'htte-serializers-json', options: { serializer: {} } }
      let result = { module: './serializers/json', options: { serializer: {} } }
      expect(config._parseSerializerItem(item, scopedLogger.enter('[0]'))).toEqual(result)
    })
  })
})

describe('public functions', () => {
  let configFile = resolveFixtureFile('./config/realworld.yaml')
  let config = new Config(configFile)
  describe('#file', () => {
    test('return absolute config file path', () => {
      expect(config.file()).toBe(configFile)
    })
  })
  describe('#rootDir', () => {
    test('return root directory path', () => {
      expect(config.rootDir()).toBe(path.dirname(configFile))
    })
  })
  describe('#sessionFile', () => {
    test('return session file path', () => {
      expect(config.sessionFile()).toEqual('/tmp/realworld.session')
    })
  })
  describe('#exports', () => {
    test('return exports data object', () => {
      expect(config.exports()).toEqual({})
    })
  })
  describe('#findAPI', () => {
    test('return found APIObject', () => {
      expect(config.findAPI('deleteComment')).toEqual({
        keys: ['id', 'slug'],
        method: 'delete',
        name: 'deleteComment',
        url: 'http://localhost:3000/api/articles/{slug}/comments/{id}',
        timeout: 1000,
        type: 'json'
      })
    })
    test('return undefined if api does not find', () => {
      expect(config.findAPI('delComment')).toBeUndefined()
    })
  })
  describe('#findSerializer', () => {
    test('return type of default serializer', () => {
      expect(config.findSerializer().name).toBe(config._type)
    })
    test('can find by name', () => {
      expect(config.findSerializer('json').name).toBe(config._type)
    })
    test('can find by type', () => {
      expect(config.findSerializer('application/json').name).toBe(config._type)
    })
    test('return undefined if type of serializer does not find', () => {
      expect(config.findSerializer('exe')).toBeUndefined()
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
  describe('parseAPI', () => {
    test('APIObject should have method "get" even omitted', () => {
      let { config, logger } = init()
      let value = { name: 'getFeed', uri: '/feed' }
      let scopedLogger = logger.enter('apis').enter('getFeed')
      let api = config.parseAPI(value, scopedLogger)
      expect(api.method).toEqual('get')
    })
    test('APIObject should have url which is absolute even uri is relative', () => {
      let { config, logger } = init()
      let value = { name: 'getFeed', uri: '/feed' }
      let scopedLogger = logger.enter('apis').enter('getFeed')
      let api = config.parseAPI(value, scopedLogger)
      expect(api.url).toEqual(config._url + value.uri)
    })
    test('log error if uri is not valid', () => {
      let { config, logger } = init()
      let value = { name: 'getFeed', uri: 'feed' }
      let scopedLogger = logger.enter('apis').enter('getFeed')
      let api = config.parseAPI(value, scopedLogger)
      expect(scopedLogger.toString()).toBe(`    getFeed:
      url:
        must be valid web url, not feed
`)
    })
    test('APIObject with custom timeout', () => {
      let { config, logger } = init()
      let value = { name: 'getFeed', uri: '/feed', timeout: 500 }
      let scopedLogger = logger.enter('apis').enter('getFeed')
      let api = config.parseAPI(value, scopedLogger)
      expect(api.timeout).toEqual(500)
    })
    test('log error if timeout is not integer', () => {
      let { config, logger } = init()
      let value = { name: 'getFeed', uri: '/feed', timeout: '500s' }
      let scopedLogger = logger.enter('apis').enter('getFeed')
      let api = config.parseAPI(value, scopedLogger)
      expect(scopedLogger.toString()).toBe(`    getFeed:
      timeout:
        must be integer
`)
    })
    test('log error when type is unregisted', () => {
      let { config, logger } = init()
      let value = { name: 'getFeed', uri: '/feed', type: 'exe' }
      let scopedLogger = logger.enter('apis').enter('getFeed')
      let api = config.parseAPI(value, scopedLogger)
      expect(scopedLogger.toString()).toMatch(`    getFeed:
      type:
        must be one of json,xml
`)
    })
    test('log error when method is not valid', () => {
      let { config, logger } = init()
      let value = { name: 'getFeed', uri: '/feed', method: 'pst' }
      let scopedLogger = logger.enter('apis').enter('getFeed')
      let api = config.parseAPI(value, scopedLogger)
      expect(scopedLogger.toString()).toBe(`    getFeed:
      method:
        must be valid http method, not pst
`)
    })
    test('APIObject should have keys with url params', () => {
      let { config, logger } = init()
      let value = { name: 'getComment', uri: '/articles/{slug}/comments/{id}' }
      let scopedLogger = logger.enter('apis').enter('getComment')
      let api = config.parseAPI(value, scopedLogger)
      expect(api.keys).toEqual(['id', 'slug'])
    })
  })
})

function init() {
  let config = new Config(resolveFixtureFile('./config/empty.yaml'))
  return { config, logger: config._logger }
}
