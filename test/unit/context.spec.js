const Context = require('../../src/context')
const Logger = require('../../src/logger')

jest.mock('../../src/create-query', () => jest.fn().mockReturnValue(jest.fn()))

describe('Test Context', () => {
  describe('constructor', () => {
    test('private property', () => {
      let { unit, session, config, logger, context } = init()
      expect(context._unit).toBe(unit)
      expect(context._session).toBe(session)
      expect(context._config).toBe(config)
      expect(context._logger).toBe(logger)
      expect(session.records.mock.calls).toHaveLength(1)
      expect(config.exports.mock.calls).toHaveLength(1)
    })
  })
  describe('logger', () => {
    test('should return logger', () => {
      let { context, logger } = init()
      expect(context.logger()).toBe(logger)
    })
  })
  describe('record', () => {
    test('should record key-value pairs', () => {
      let { context, session, unit } = init()
      context.record('req', { body: { msg: 'ok' } })
      expect(session.writeUnit.mock.calls).toHaveLength(1)
      expect(session.writeUnit.mock.calls[0][0]).toBe(unit)
    })
  })
  describe('resolveReq', () => {
    test('should resolve the request', () => {
      let { context } = init()
      let req = { a: 3 }
      expect(context.resolveReq(req)).toEqual(req)
    })
    test('return {} when has no request', () => {
      let { context } = init()
      expect(context.resolveReq()).toEqual({})
    })
    test('log error when resolving', () => {
      let { context, logger } = init()
      let req = { a: (context, literal) => context.error('something wrong') }
      expect(context.resolveReq(req)).toBeDefined()
      expect(logger.toString()).toBe(`  test1:
    req:
      a:
        something wrong
`)
    })
  })
  describe('diffRes', () => {
    test('should diff the response', () => {
      let { context } = init()
      let exp = { status: 200, body: { msg: 'ok' }, headers: { 'Content-Type': 'application/json' } }
      let res = { status: 200, body: { msg: 'ok' }, headers: { 'Content-Type': 'application/json' } }
      expect(context.diffRes(exp, res)).toBe(true)
    })
    test('log error when diffing', () => {
      let { context, logger } = init()
      let exp = { status: 200, body: { msg: 'ok' }, headers: { 'Content-Type': 'application/json' } }
      let res = {}
      expect(context.diffRes(exp, res)).toBe(false)
      expect(logger.toString()).toBe(`  test1:
    res:
      status:
        value diff, 200 ≠ undefined
      body:
        type diff, object ≠ undefined
      headers:
        type diff, object ≠ undefined
`)
    })
    test('only diff the properties the expect value have when diffing headers', () => {
      let { context, logger } = init()
      let exp = { headers: { H1: 33 } }
      let res = { status: 200, headers: { 'Content-Type': 'application/json', H1: 33 } }
      expect(context.diffRes(exp, res)).toBe(true)
    })
    test('return true if the expect have no status, headers and body properties', () => {
      let { context, logger } = init()
      let exp = {}
      let res = { status: 200, body: { msg: 'ok' }, headers: { 'Content-Type': 'application/json' } }
      expect(context.diffRes(exp, res)).toBe(true)
    })
    test('log error if the expect have no status, headers and body properties but the actual have status > 299', () => {
      let { context, logger } = init()
      let exp = {}
      let res = { status: 400, body: { error: 'wrong' }, headers: { 'Content-Type': 'application/json' } }
      expect(context.diffRes(exp, res)).toBe(false)
    })
  })
})

function init() {
  let unit = {}
  let session = { records: jest.fn(), writeUnit: jest.fn() }
  let config = { exports: jest.fn() }
  let logger = new Logger('HTTE').enter('test1')
  let context = new Context(unit, session, config, logger)
  return { unit, session, config, logger, context }
}
