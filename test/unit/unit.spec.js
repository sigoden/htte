const Logger = require('../../src/logger')
const JSONSerializer = require('../../src/serializers/json')
const Unit = require('../../src/unit')
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
    test('return true when logger is not dirty', () => {
      expect(unit.valid()).toBe(true)
      expect(unit._logger.toString()).toBe('')
    })
    test('return false when logger is dirty', () => {
      unit._logger.log('dirty')
      expect(unit.valid()).toBe(false)
    })
  })
  describe('#name', () => {
    test('return unit name if name exists', () => {
      let { unit, options } = createUnit1({ name: 'unit1' })
      expect(unit.name()).toBe(options.name)
    })
    test('return generated name if unit have no property name', () => {
      let { unit, options } = createUnit1({ scopeIndexes: [1, 2, 3] })
      expect(unit.name()).toBe(options.api + '-' + options.scopeIndexes.join('-'))
    })
  })
  describe('#module', () => {
    test('return module name', () => {
      let { unit, module } = createUnit1()
      expect(unit.module()).toBe(module.name())
    })
  })
  describe('#api', () => {
    test('return this._api', () => {
      let { unit } = createUnit1()
      expect(unit.api()).toBe(unit._api)
    })
  })
  describe('#id', () => {
    test('return id, created by join module() and name() with -', () => {
      let { unit } = createUnit1({ name: 'unit1' })
      expect(unit.id()).toBe(unit.module() + '-' + unit.name())
    })
  })
  describe('#dependencies', () => {
    test('return module dependencies', () => {
      let { unit, module } = createUnit1({
        dependencies: [{ name: 'module2', module: 'module2' }]
      })
      expect(unit.dependencies()).toBe(module.dependencies())
    })
  })
  describe('#describes', () => {
    test('return scope._describes', () => {
      let { unit, scope } = createUnit1({
        scopeDescribes: ['group 1', 'unit 1']
      })
      expect(unit.describes()).toBe(scope._describes)
    })
  })
  describe('debug', () => {
    test('return empty string if unit have not executed', () => {
      let { unit, logger } = createUnit1()
      unit.debug({}, {}, logger)
      expect(logger.toString()).toBe('')
    })
    test('print req and res', () => {
      let { unit, logger, options } = createUnit2()
      unit._axios = { method: unit.api().method, url: unit.api().url }
      unit.debug(options.req, options.res, logger)
      expect(logger.toString()).toBe(`-:
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
      let { unit, logger, options } = createUnit1()
      unit._axios = { method: unit.api().method, url: unit.api().url }
      unit.debug(options.req, { body: { msg: 'ok' }, status: 200 }, logger)
      expect(logger.toString()).toBe(`-:
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
      let { unit, logger } = createUnit1()
      unit._axios = { method: unit.api().method, url: unit.api().url }
      unit._template.req = { body: { content: 'awesome' }, headers: { Authorization: 'Bearer balabala' } }
      unit._template.res = { body: { msg: 'ok' }, headers: { 'Content-Type': 'application/json' }, status: 200 }
      unit.debug(unit._template.req, unit._template.res, logger)
      expect(logger.toString()).toBe(`-:
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
      let { unit, logger } = createUnit1()
      unit._axios = { method: unit.api().method, url: unit.api().url }
      unit._template.req = { body: { content: 'awesome' }, headers: { Authorization: 'Bearer balabala' } }
      unit._template.res = { err: new Error('connect ECONNREFUSED 127.0.0.1:3000'), time: 10.03 }
      unit.debug(unit._template.req, unit._template.res, logger)
      expect(logger.toString()).toBe(`-:
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
      let { unit, logger } = createUnit1({ name: 'unit1' })
      unit.view(logger)
      expect(logger.toString()).toBe(`-:
  unit 1 | module1-unit1 | getFeed
`)
    })
    test('keep unit hireachy', () => {
      let { unit, logger } = createUnit1({ name: 'unit1', scopeDescribes: ['group 1', 'sub group 2', 'unit 1'] })
      unit.view(logger)
      expect(logger.toString()).toBe(`-:
  group 1:
    sub group 2:
      unit 1 | module1-unit1 | getFeed
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
      let response = { status: 200, headers: {}, data: { content: 'good!' } }
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
      let response = { status: 400, headers: {}, data: { code: 'NOT AUTHORIZATION' } }
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
        expect(result.res.err).toBe(err.message)
        expect(result.req).toBeDefined()
        expect(result.pass).toBe(false)
      })
    })
  })
})
describe('private function', () => {
  describe('_parseAPI', () => {
    test('return api object if find', () => {
      let { unit, logger, options } = createUnit1()
      let api = unit._parseAPI(options.api, logger)
      expect(api).toEqual({
        keys: [],
        method: 'get',
        name: 'getFeed',
        url: 'http://localhost:3000/feed',
        type: 'json',
        timeout: 1000
      })
    })
    test('log error if not find', () => {
      let { unit, logger } = createUnit1()
      let api = unit._parseAPI('notfind', logger)
      expect(api).toBeUndefined()
      expect(logger.toString()).toMatch(`cannot find api`)
    })
  })
  describe('_parseReqParams', () => {
    test('return params', () => {
      let { unit, logger, options } = createUnit2()
      let target = options.req.params
      let result = unit._parseReqParams(target, logger)
      expect(result).toBe(target)
    })
    test('return undefined if _api is undefined', () => {
      let { unit, logger, options } = createUnit2()
      let target = options.req.params
      unit._api = undefined
      let result = unit._parseReqParams(target, logger)
      expect(result).toBeUndefined()
    })
    test('log error if params is not object or undefined', () => {
      let { unit, logger, options } = createUnit2()
      let result = unit._parseReqParams('abc', logger)
      expect(logger.toString()).toMatch('must be object')
      expect(result).toBeUndefined()
    })
    test('log error when api have keys but req have no params', () => {
      let { unit, logger, options } = createUnit2()
      let result = unit._parseReqParams(undefined, logger)
      expect(logger.toString()).toMatch('must have property [params]')
      expect(result).toBeUndefined()
    })
    test('log error when params have extra fields', () => {
      let { unit, logger, options } = createUnit2()
      let result = unit._parseReqParams({ slug: 'a', id: 'b' }, logger)
      expect(logger.toString()).toMatch('params diff, extra')
      expect(result).toBeUndefined()
    })
    test('log error when params miss fields', () => {
      let { unit, logger, options } = createUnit2()
      let result = unit._parseReqParams({}, logger)
      expect(logger.toString()).toMatch('params diff, miss')
      expect(result).toBeUndefined()
    })
  })
  describe('_maybeStatus', () => {
    test('should work', () => {
      let { unit, logger } = createUnit1()
      let result = unit._maybeStatus(204, logger)
      expect(logger.toString()).toBe('')
      expect(result).toBe(204)
    })
    test('log error if status is not integer', () => {
      let { unit, logger } = createUnit1()
      let result = unit._maybeStatus('ok', logger)
      expect(logger.toString()).toMatch('must be http code')
      expect(result).toBeUndefined()
    })
  })
  describe('_parseReq', () => {
    test('return {} if req is undefined', () => {
      let { unit, logger } = createUnit1()
      let result = unit._parseReq(undefined, logger)
      expect(logger.toString()).toBe('')
      expect(result).toEqual({})
    })
    test('log error if req is not object or undefined', () => {
      let { unit, logger } = createUnit1()
      let result = unit._parseReq('abc', logger)
      expect(logger.toString()).toMatch('must be object')
      expect(result).toEqual({})
    })
    test('should work', () => {
      let { unit, logger, options } = createUnit2()
      let target = options.req
      let result = unit._parseReq(target, logger)
      expect(logger.toString()).toBe('')
      expect(result).toEqual(target)
      expect(result.body).not.toBe(target.body)
      expect(result.headers).not.toBe(target.headers)
      expect(result.query).not.toBe(target.query)
      expect(result.params).not.toBe(target.params)
    })
    test('log error when any of headers, query, params', () => {
      let { unit, logger } = createUnit1()
      let target = { headers: '', query: '', params: { slug: 'v' } }
      let result = unit._parseReq(target, logger)
      expect(logger.toString()).toBe(`-:
  headers:
    must be object
  query:
    must be object
  params:
    params diff, extra slug
`)
    })
  })
  describe('_parseRes', () => {
    test('return {} if res is undefined', () => {
      let { unit, logger } = createUnit1()
      let result = unit._parseRes(undefined, logger)
      expect(result).toEqual({})
    })
    test('should work', () => {
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
      let result = unit._parseRes('abc', logger)
      expect(logger.toString()).toMatch('must be object')
    })
    test('log error if res.headers is not object or undefined', () => {
      let { unit, logger } = createUnit1()
      let result = unit._parseRes({ headers: 'abc' }, logger)
      expect(logger.toString()).toMatch('must be object')
    })
  })
  describe('_request', () => {
    beforeEach(() => {
      require('axios').mockReset()
    })
    test('reject if logger is dirty', () => {
      let { unit, logger } = createUnit2()
      logger.log('dirty')
      return unit._request(unit._api, unit._req, logger).catch(msg => {
        expect(msg).toBe('cannot create request')
      })
    })
    test('req have no body, axios send no data', () => {
      require('axios').mockImplementation(v => Promise.resolve(v))
      let { unit, logger } = createUnit1({ req: { headers: { Authorization: 'Bearer balaba' } } })
      return unit._request(unit._api, unit._req, logger).then(result => {
        expect(result.data).toBeUndefined()
      })
    })
    test('should work', () => {
      require('axios').mockImplementation(v => Promise.resolve(v))
      let { unit, logger } = createUnit2()
      return unit._request(unit._api, unit._req, logger).then(result => {
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
      return unit._request(unit._api, unit._req, logger).catch(result => {
        expect(result).toMatch('cannot serialize body')
      })
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
  let config = {
    findAPI: _api =>
      _api === api
        ? { keys: apiKeys, name: api, url: apiUrl, method: apiMethod || 'get', timeout: 1000, type }
        : undefined,
    findSerializer: type => (type === 'json' || type === undefined ? JSONSerializer : undefined)
  }
  let logger = new Logger()
  let scope = { _describes: scopeDescribes, _indexes: scopeIndexes }
  let module = {
    name: () => moduleName,
    dependencies: () => dependencies || []
  }
  let unit = new Unit(template, config, logger, scope, module)
  logger.tryThrow()
  return { options, template, config, logger, scope, module, unit }
}
