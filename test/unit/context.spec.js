const Context = require('../../src/context')
const Logger = require('../../src/logger')

jest.mock('../../src/query-variable', () => jest.fn().mockReturnValue(jest.fn()))

describe('Test Context', () => {
  describe('constructor', () => {
    test('private property', () => {
      let { unit, session, config, logger, context } = init()
      expect(context._unit).toBe(unit)
      expect(context._session).toBe(session)
      expect(context._config).toBe(config)
      expect(context._logger).toBe(logger)
      expect(session.records.mock.calls).toHaveLength(1)
      expect(config.variables.mock.calls).toHaveLength(1)
    })
  })
  describe('logger', () => {
    test('should work', () => {
      let { context, logger } = init()
      expect(context.logger()).toBe(logger)
    })
  })
  describe('record', () => {
    test('should work', () => {
      let { context, session, unit } = init()
      context.record('req', { body: { msg: 'ok' } })
      expect(session.writeUnit.mock.calls).toHaveLength(1)
      expect(session.writeUnit.mock.calls[0][0]).toBe(unit)
    })
  })
  describe('resolveReq', () => {
    test('should work', () => {
      let { context } = init()
      let req = { a: 3 }
      expect(context.resolveReq(req)).toEqual(req)
    })
    test('return {} when undefined', () => {
      let { context } = init()
      expect(context.resolveReq()).toEqual({})
    })
    test('return undefined if resolve runing into error', () => {
      let { context, logger } = init()
      let req = { a: (context, literal) => context.error('something wrong') }
      expect(context.resolveReq(req)).toBeUndefined()
      expect(logger.toString()).toMatch('something wrong')
    })
  })
  describe('diffRes', () => {
    test('should work', () => {
      let { context } = init()
      let exp = { status: 200, body: { msg: 'ok' }, headers: { 'Content-Type': 'application/json' } }
      let res = { status: 200, body: { msg: 'ok' }, headers: { 'Content-Type': 'application/json' } }
      expect(context.diffRes(exp, res)).toBe(true)
    })
    test('log error', () => {
      let { context, logger } = init()
      let exp = { status: 200, body: { msg: 'ok' }, headers: { 'Content-Type': 'application/json' } }
      let res = {}
      expect(context.diffRes(exp, res)).toBe(false)
      expect(logger.enters(['res', 'status']).dirty()).toBe(true)
      expect(logger.enters(['res', 'headers']).dirty()).toBe(true)
      expect(logger.enters(['res', 'body']).dirty()).toBe(true)
    })
    test('return true if omit status, headers and body property of expect', () => {
      let { context, logger } = init()
      let exp = {}
      let res = { status: 200, body: { msg: 'ok' }, headers: { 'Content-Type': 'application/json' } }
      expect(context.diffRes(exp, res)).toBe(true)
    })
  })
})

function init() {
  let unit = {}
  let session = { records: jest.fn(), writeUnit: jest.fn() }
  let config = { variables: jest.fn() }
  let logger = new Logger()
  let context = new Context(unit, session, config, logger)
  return { unit, session, config, logger, context }
}
