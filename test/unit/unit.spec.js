const Logger = require('../../src/logger')
const JSONSerializer = require('../../src/serializers/json')
const Unit = require('../../src/unit')
const Config = require('../../src/config')
const _ = require('lodash')

jest.mock('axios')

let createUnit1 = (modify = {}) => {
  return init(
    _.defaultsDeep(modify, {
      describe: 'unit 1',
      api: 'getFeed',
      apiUrl: 'http://localhost:3000/feed',
      moduleName: 'module1'
    })
  )
}

let createUnit2 = (modify = {}) => {
  return init(
    _.defaultsDeep(modify, {
      describe: 'unit 1',
      api: 'createComment',
      apiUrl: 'http://localhost:3000/articles/{slug}/comments',
      apiMethod: 'post',
      apiKeys: ['slug'],
      moduleName: 'module1',
      req: {
        params: { slug: 'how-to-train-your-dragon-axsda' },
        query: { upsert: true },
        headers: {
          Authorization: 'Bearer tokenbalabala'
        },
        body: { content: 'awsome' }
      },
      res: {
        status: 200,
        body: { content: 'awsome' }
      }
    })
  )
}

describe('Test Unit', () => {
  test('private property', () => {
    let { template, config, logger, scope, module, unit } = createUnit1()
    expect(unit._config).toBe(config)
    expect(unit._logger).toBe(logger)
    expect(unit._module).toBe(module)
    expect(unit._scope).toBe(scope)
    expect(unit._template).toBe(template)
    expect(unit._api).toEqual({
      keys: [],
      name: 'getFeed',
      url: 'http://localhost:3000/feed',
      method: 'get',
      type: 'json',
      timeout: 1000
    })
    expect(unit._req).toEqual({})
    expect(unit._res).toEqual({})
    expect(logger.toString()).toEqual('')
  })
})

describe('public function', () => {
  describe('#valid', () => {
    let { unit } = createUnit1()
    test('return true when logger is clean', () => {
      expect(unit.valid()).toBe(true)
      expect(unit._logger.toString()).toBe('')
    })
    test('return false when logger is dirty', () => {
      unit._logger.log('dirty')
      expect(unit.valid()).toBe(false)
    })
  })
  describe('#name', () => {
    test('return unit name if unit data object has property name', () => {
      let { unit, options } = createUnit1({ name: 'unit1' })
      expect(unit.name()).toBe(options.name)
    })
    test('return generated name if unit data object has no property name', () => {
      let { unit, options } = createUnit1({ scopeIndexes: [1, 2, 3] })
      expect(unit.name()).toBe(options.api + '-' + options.scopeIndexes.join('-'))
    })
  })
  describe('#module', () => {
    test('return name of module of unit', () => {
      let { unit, module } = createUnit1()
      expect(unit.module()).toBe(module.name())
    })
  })
  describe('#api', () => {
    test('return APIObject', () => {
      let { unit } = createUnit1()
      expect(unit.api()).toBe(unit._api)
    })
  })
  describe('#id', () => {
    test('return id of unit', () => {
      let { unit } = createUnit1({ name: 'unit1' })
      expect(unit.id()).toBe(unit.module() + '-' + unit.name())
    })
  })
  describe('#dependencies', () => {
    test('return dependencies', () => {
      let { unit, module } = createUnit1({
        dependencies: [{ name: 'module2', module: 'module2' }]
      })
      expect(unit.dependencies()).toBe(module.dependencies())
    })
  })
  describe('#describes', () => {
    test('return describes', () => {
      let { unit, scope } = createUnit1({
        scopeDescribes: ['group 1', 'unit 1']
      })
      expect(unit.describes()).toBe(scope._describes)
    })
  })
  describe('debug', () => {
    test(`return '' if unit have not been execute`, () => {
      let { unit, logger } = createUnit1()
      unit.debug({}, {}, logger)
      expect(logger.toString()).toBe('')
    })
    test('print req and res', () => {
      let { unit, options } = createUnit2()
      let debugLogger = new Logger()
        .enter('RunUnits')
        .enter(unit.module())
        .enters(unit.describes())
      unit._axios = { method: unit.api().method, url: unit.api().url }
      unit.debug(options.req, options.res, debugLogger)
      expect(debugLogger.toString()).toBe(`      unit 1:
        debug:
          req:
            url: 'http://localhost:3000/articles/{slug}/comments'
            method: post
            headers:
              Authorization: Bearer tokenbalabala
            body:
              content: awsome
          res:
            status: 200
            body:
              content: awsome
          
`)
    })
    test('print req and res while req is empty', () => {
      let { unit, options } = createUnit1()
      let debugLogger = new Logger()
        .enter('RunUnits')
        .enter(unit.module())
        .enters(unit.describes())
      unit._axios = { method: unit.api().method, url: unit.api().url }
      unit.debug(options.req, { body: { msg: 'ok' }, status: 200 }, debugLogger)
      expect(debugLogger.toString()).toBe(`      unit 1:
        debug:
          req:
            url: 'http://localhost:3000/feed'
            method: get
          res:
            status: 200
            body:
              msg: ok
          
`)
    })
    test('print req and res if req.headers, req.body and res.body exists', () => {
      let { unit } = createUnit1()
      let debugLogger = new Logger()
        .enter('RunUnits')
        .enter(unit.module())
        .enters(unit.describes())
      unit._axios = { method: unit.api().method, url: unit.api().url }
      unit._template.req = { body: { content: 'awesome' }, headers: { Authorization: 'Bearer balabala' } }
      unit._template.res = { body: { msg: 'ok' }, headers: { 'Content-Type': 'application/json' }, status: 200 }
      unit.debug(unit._template.req, unit._template.res, debugLogger)
      expect(debugLogger.toString()).toBe(`      unit 1:
        debug:
          req:
            url: 'http://localhost:3000/feed'
            method: get
            headers:
              Authorization: Bearer balabala
            body:
              content: awesome
          res:
            status: 200
            body:
              msg: ok
            headers:
              Content-Type: application/json
          
`)
    })
    test('print req and res if res.err', () => {
      let { unit } = createUnit1()
      let debugLogger = new Logger()
        .enter('RunUnits')
        .enter(unit.module())
        .enters(unit.describes())
      unit._axios = { method: unit.api().method, url: unit.api().url }
      unit._template.req = { body: { content: 'awesome' }, headers: { Authorization: 'Bearer balabala' } }
      unit._template.res = { err: new Error('connect ECONNREFUSED 127.0.0.1:3000'), time: 10.03 }
      unit.debug(unit._template.req, unit._template.res, debugLogger)
      expect(debugLogger.toString()).toBe(`      unit 1:
        debug:
          req:
            url: 'http://localhost:3000/feed'
            method: get
            headers:
              Authorization: Bearer balabala
            body:
              content: awesome
          res:
            err: 'Error: connect ECONNREFUSED 127.0.0.1:3000'
          
`)
    })
  })
  describe('#view', () => {
    test('view unit', () => {
      let { unit } = createUnit1({ name: 'unit1' })
      let viewLogger = new Logger('ViewUnits')
      unit.view(viewLogger)
      expect(viewLogger.toString()).toBe(`ViewUnits:
  module1:
    unit 1:
      unit1
`)
    })
    test('keep unit hireachy', () => {
      let { unit } = createUnit1({
        name: 'unit1',
        scopeDescribes: ['group 1', 'sub group 2', 'unit 1'],
        scopeIndexes: [0, 0, 0]
      })
      let viewLogger = new Logger('ViewUnits')
      unit.view(viewLogger)
      expect(viewLogger.toString()).toBe(`ViewUnits:
  module1:
    group 1:
      sub group 2:
        unit 1:
          unit1
`)
    })
  })
  describe('#inspect', () => {
    test('inspect unit', () => {
      let { unit, options } = createUnit2()
      expect(unit.inspect({ req: options.req, res: options.res })).toBe(`name: createComment-0
module: module1
api:
  keys:
    - slug
  name: createComment
  url: 'http://localhost:3000/articles/{slug}/comments'
  method: post
  timeout: 1000
  type: json
req:
  params:
    slug: how-to-train-your-dragon-axsda
  query:
    upsert: true
  headers:
    Authorization: Bearer tokenbalabala
  body:
    content: awsome
res:
  status: 200
  body:
    content: awsome
`)
    })
    test('inspect unit if no request nor response data', () => {
      let { unit, options } = createUnit1()
      expect(unit.inspect({})).toBe(`name: getFeed-0
module: module1
api:
  keys: []
  name: getFeed
  url: 'http://localhost:3000/feed'
  method: get
  timeout: 1000
  type: json
req: {}
res: {}
`)
    })
  })
  describe('#execute', () => {
    beforeEach(() => {
      require('axios').mockReset()
    })
    test('request and response all success', () => {
      let ctx = {
        record: jest.fn(),
        resolveReq: jest.fn().mockImplementation(v => v),
        logger: () => new Logger(),
        diffRes: () => true
      }
      let response = { status: 200, headers: { 'content-type': 'application/json' }, data: { content: 'good!' } }
      let mockAxios = require('axios').mockImplementation(() => Promise.resolve(response))
      let { unit, logger } = createUnit2()
      return unit.execute(ctx).then(result => {
        expect(result.res.status).toBe(response.status)
        expect(result.res.headers).toBe(response.headers)
        expect(result.res.body).toBe(response.data)
        expect(result.res.time).toBeDefined()
        expect(result.req).toBeDefined()
        expect(result.pass).toBe(true)
        expect(ctx.record.mock.calls[0][0]).toBe('req')
        expect(ctx.record.mock.calls[0][1]).toBe(result.req)
      })
    })
    test('response with error', () => {
      let ctx = {
        record: jest.fn(),
        resolveReq: jest.fn().mockImplementation(v => v),
        logger: () => new Logger(),
        diffRes: () => true
      }
      let response = {
        status: 400,
        headers: { 'content-type': 'application/json' },
        data: { code: 'NOT AUTHORIZATION' }
      }
      let mockAxios = require('axios').mockImplementation(() => Promise.reject({ response }))
      let { unit, logger } = createUnit2()
      return unit.execute(ctx).then(result => {
        expect(result.res.status).toBe(response.status)
        expect(result.req).toBeDefined()
        expect(result.pass).toBe(true)
      })
    })
    test('request with error', () => {
      let ctx = {
        record: jest.fn(),
        resolveReq: jest.fn().mockImplementation(v => v),
        logger: () => new Logger(),
        diffRes: () => true
      }
      let err = new Error('DIAL ADDRESS')
      let mockAxios = require('axios').mockImplementation(() => Promise.reject(err))
      let { unit, logger } = createUnit2()
      return unit.execute(ctx).then(result => {
        expect(result.res.err).toBe(err)
        expect(result.req).toBeDefined()
        expect(result.pass).toBe(false)
      })
    })
  })
})
describe('private function', () => {
  describe('_parseAPI', () => {
    test('return api object', () => {
      let { unit, logger, options } = createUnit1()
      let scopedLogger = logger.enter('api')
      let api = unit._parseAPI(options.api, scopedLogger)
      expect(api).toEqual({
        keys: [],
        method: 'get',
        name: 'getFeed',
        url: 'http://localhost:3000/feed',
        type: 'json',
        timeout: 1000
      })
    })
    test('log error if api is not found', () => {
      let { unit, logger } = createUnit1()
      let scopedLogger = logger.enter('api')
      let api = unit._parseAPI('notfind', scopedLogger)
      expect(api).toBeUndefined()
      expect(logger.toString()).toBe(`    [0](unit 1):
      api:
        cannot find api notfind
`)
    })
    test('parameter api is object', () => {
      let { unit, logger } = createUnit1()
      let scopedLogger = logger.enter('api')
      let api = unit._parseAPI({ name: 'echo', uri: '/echo' }, scopedLogger)
      expect(api).toEqual({
        keys: [],
        method: 'get',
        name: 'echo',
        timeout: 3000,
        type: 'json',
        url: 'http://localhost:3000/echo'
      })
    })
    test('parameter api is not object nor string', () => {
      let { unit, logger } = createUnit1()
      let scopedLogger = logger.enter('api')
      let api = unit._parseAPI([], scopedLogger)
      expect(logger.toString()).toBe(`    [0](unit 1):
      api:
        must be string or object
`)
    })
    test('parameter api is object but have no property name', () => {
      let { unit, logger } = createUnit1()
      let scopedLogger = logger.enter('api')
      let api = unit._parseAPI({ uri: '/echo' }, scopedLogger)
      expect(logger.toString()).toBe(`    [0](unit 1):
      api:
        must have properties name, uri
`)
    })
    test('parameter api is object but have no property uri', () => {
      let { unit, logger } = createUnit1()
      let scopedLogger = logger.enter('api')
      let api = unit._parseAPI({ name: 'echo' }, scopedLogger)
      expect(logger.toString()).toBe(`    [0](unit 1):
      api:
        must have properties name, uri
`)
    })
  })
  describe('_parseReqParams', () => {
    test('should return parsed params', () => {
      let { unit, logger, options } = createUnit2()
      let scopedLogger = logger.enter('req').enter('params')
      let target = options.req.params
      let result = unit._parseReqParams(target, scopedLogger)
      expect(result).toBe(target)
    })
    test('return undefined if APIObject of unit have not been found', () => {
      let { unit, logger, options } = createUnit2()
      let scopedLogger = logger.enter('req').enter('params')
      let target = options.req.params
      unit._api = undefined
      let result = unit._parseReqParams(target, scopedLogger)
      expect(result).toBeUndefined()
    })
    test('log error if params is not object nor undefined', () => {
      let { unit, logger, options } = createUnit2()
      let scopedLogger = logger.enter('req').enter('params')
      let result = unit._parseReqParams('abc', scopedLogger)
      expect(result).toBeUndefined()
      expect(logger.toString()).toBe(`    [0](unit 1):
      req:
        params:
          must be object
`)
    })
    test('log error when api has url params but req has no params', () => {
      let { unit, logger, options } = createUnit2()
      let scopedLogger = logger.enter('req').enter('params')
      let result = unit._parseReqParams(undefined, scopedLogger)
      expect(result).toBeUndefined()
      expect(logger.toString()).toBe(`    [0](unit 1):
      req:
        params:
          must have property params
`)
    })
    test('log error when params have extra fields', () => {
      let { unit, logger, options } = createUnit2()
      let scopedLogger = logger.enter('req').enter('params')
      let result = unit._parseReqParams({ slug: 'a', id: 'b' }, scopedLogger)
      expect(result).toBeUndefined()
      expect(logger.toString()).toBe(`    [0](unit 1):
      req:
        params:
          params diff, -- id
`)
    })
    test('log error when params have less fields', () => {
      let { unit, logger, options } = createUnit2()
      let scopedLogger = logger.enter('req').enter('params')
      let result = unit._parseReqParams({}, scopedLogger)
      expect(result).toBeUndefined()
      expect(logger.toString()).toBe(`    [0](unit 1):
      req:
        params:
          params diff, ++ slug
`)
    })
  })
  describe('_maybeStatus', () => {
    test('should parse status code', () => {
      let { unit, logger } = createUnit1()
      let scopedLogger = logger.enter('res').enter('status')
      let result = unit._maybeStatus(204, scopedLogger)
      expect(logger.toString()).toBe('')
      expect(result).toBe(204)
    })
    test('log error if status code is not integer', () => {
      let { unit, logger } = createUnit1()
      let scopedLogger = logger.enter('res').enter('status')
      let result = unit._maybeStatus('ok', scopedLogger)
      expect(result).toBeUndefined()
      expect(logger.toString()).toBe(`    [0](unit 1):
      res:
        status:
          must be valid http code
`)
    })
  })
  describe('_parseReq', () => {
    test('return {} if req is undefined', () => {
      let { unit, logger } = createUnit1()
      let scopedLogger = logger.enter('req')
      let result = unit._parseReq(undefined, scopedLogger)
      expect(result).toEqual({})
      expect(logger.dirty()).toBe(false)
    })
    test('log error if req is not object or undefined', () => {
      let { unit, logger } = createUnit1()
      let scopedLogger = logger.enter('req')
      let result = unit._parseReq('abc', scopedLogger)
      expect(result).toEqual({})
      expect(logger.toString()).toBe(`    [0](unit 1):
      req:
        must be object
`)
    })
    test('should validate and parse request data object', () => {
      let { unit, logger, options } = createUnit2()
      let target = options.req
      let scopedLogger = logger.enter('req')
      let result = unit._parseReq(target, scopedLogger)
      expect(logger.dirty()).toBe(false)
      expect(result).toEqual(target)
      expect(result.body).not.toBe(target.body)
      expect(result.headers).not.toBe(target.headers)
      expect(result.query).not.toBe(target.query)
      expect(result.params).not.toBe(target.params)
    })
    test('log error when headers, query, params have something wrong', () => {
      let { unit, logger } = createUnit1()
      let scopedLogger = logger.enter('req')
      let target = { headers: '', query: '', params: { slug: 'v' } }
      let result = unit._parseReq(target, scopedLogger)
      expect(logger.toString()).toBe(`    [0](unit 1):
      req:
        headers:
          must be object
        query:
          must be object
        params:
          params diff, -- slug
`)
    })
  })
  describe('_parseRes', () => {
    test('return {} if res is undefined', () => {
      let { unit, logger } = createUnit1()
      let scopedLogger = logger.enter('res')
      let result = unit._parseRes(undefined, scopedLogger)
      expect(result).toEqual({})
    })
    test('should validate and parse response data object', () => {
      let { unit, logger } = createUnit2()
      let target = {
        status: 204,
        body: { content: 'good!' },
        headers: { 'Set-Cookie': 'balabala' }
      }
      let result = unit._parseRes(target, logger)
      expect(result).toEqual(target)
    })
    test('log error if req is not object or undefined', () => {
      let { unit, logger } = createUnit1()
      let scopedLogger = logger.enter('res')
      let result = unit._parseRes('abc', scopedLogger)
      expect(logger.toString()).toBe(`    [0](unit 1):
      res:
        must be object
`)
    })
    test('log error if res.headers is not object or undefined', () => {
      let { unit, logger } = createUnit1()
      let scopedLogger = logger.enter('res')
      let result = unit._parseRes({ headers: 'abc' }, scopedLogger)
      expect(logger.toString()).toMatch(`    [0](unit 1):
      res:
        headers:
          must be object
`)
    })
  })
  describe('_request', () => {
    beforeEach(() => {
      require('axios').mockReset()
    })
    test('reject if logger is dirty', () => {
      let { unit, logger } = createUnit2()
      let executeLogger = new Logger()
        .enter('RunUnits')
        .enter(unit.module())
        .enters(unit.describes())
        .enter('req')
      executeLogger.log('error')
      return unit._request(unit._api, unit._req, executeLogger).catch(msg => {
        expect(msg).toBe('cannot create request')
      })
    })
    test('req have no body, axios send no data', () => {
      require('axios').mockImplementation(v => Promise.resolve(v))
      let { unit, logger } = createUnit1({ req: { headers: { Authorization: 'Bearer balaba' } } })
      let executeLogger = new Logger()
        .enter('RunUnits')
        .enter(unit.module())
        .enters(unit.describes())
        .enter('req')
      return unit._request(unit._api, unit._req, executeLogger).then(result => {
        expect(result.data).toBeUndefined()
      })
    })
    test('should make axios request object', () => {
      require('axios').mockImplementation(v => Promise.resolve(v))
      let { unit, logger } = createUnit2()
      let executeLogger = new Logger()
        .enter('RunUnits')
        .enter(unit.module())
        .enters(unit.describes())
        .enter('req')
      return unit._request(unit._api, unit._req, executeLogger).then(result => {
        expect(result).toEqual({
          data: '{"content":"awsome"}',
          headers: { Authorization: 'Bearer tokenbalabala', 'Content-Type': 'application/json' },
          method: 'post',
          timeout: 1000,
          url: 'http://localhost:3000/articles/how-to-train-your-dragon-axsda/comments?upsert=true'
        })
      })
    })
    test('reject when serializer.serialize fail', () => {
      let { unit, logger } = createUnit1({ req: { body: { content: 'good' } } })
      unit._config.findSerializer = () => ({
        serialize: () => {
          throw new Error('encode ...')
        }
      })
      let executeLogger = new Logger()
        .enter('RunUnits')
        .enter(unit.module())
        .enters(unit.describes())
        .enter('req')
      return unit._request(unit._api, unit._req, executeLogger).catch(result => {
        expect(result).toMatch('cannot serialize body')
      })
    })
  })
  describe('_deserialize', () => {
    test('should return data if serializer did not regist', () => {
      let { unit } = createUnit1()
      let data = 'content: good'
      unit._config.findSerializer = jest.fn().mockImplementation(() => {})
      let result = unit._deserialize(data, 'application/yaml')
      expect(result).toBe(data)
    })
    test('should return data if content-type is undefined', () => {
      let { unit } = createUnit1()
      let data = {}
      let result = unit._deserialize(data, undefined)
      expect(result).toBe(data)
    })
    test('should return data if serializer is json', () => {
      let { unit } = createUnit1()
      let data = { content: 'good' }
      let result = unit._deserialize(data, 'application/json')
      expect(result).toBe(data)
    })
    test('should deserialize data if serializer registed', () => {
      let { unit } = createUnit1()
      let data = 'content: good'
      let mockDeserializedData = { content: 'good' }
      let deserializeFunc = jest.fn().mockImplementation(() => mockDeserializedData)
      unit._config.findSerializer = jest.fn().mockImplementation(() => {
        return {
          deserialize: deserializeFunc
        }
      })
      let result = unit._deserialize(data, 'application/yaml')
      expect(result).toBe(mockDeserializedData)
      expect(deserializeFunc).toHaveBeenCalledWith(data, unit._api.name)
    })
  })
})

function init(options) {
  let {
    describe,
    name,
    api,
    req,
    res,
    apiUrl,
    apiMethod = 'get',
    apiKeys = [],
    type = 'json',
    scopeDescribes = [describe],
    scopeIndexes = [0],
    moduleName,
    dependencies = []
  } = options

  let template = {
    describe: describe,
    name: name,
    api: api,
    req: req,
    res: res
  }
  let config = new Config()

  config.findAPI = _api =>
    _api === api
      ? { keys: apiKeys, name: api, url: apiUrl, method: apiMethod || 'get', timeout: 1000, type }
      : undefined

  let logger = new Logger('LoadUnits').enter(moduleName)
  let scopedLogger = scopeDescribes.reduce((logger, describe, index) => {
    return logger.enter(`[${scopeIndexes[index]}](${describe})`)
  }, logger)
  let scope = { _describes: scopeDescribes, _indexes: scopeIndexes }
  let module = {
    name: () => moduleName,
    dependencies: () => dependencies || []
  }
  let unit = new Unit(template, config, scopedLogger, scope, module)
  logger.tryThrow()
  return { options, template, config, logger: scopedLogger, scope, module, unit }
}
