const ContextDiff = require('../../src/context-diff')
const Logger = require('../../src/logger')

jest.mock('../../src/diff', () => jest.fn())

const diff = require('../../src/diff')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('Test ContextDiff', () => {
  describe('constructor', () => {
    test('private property', () => {
      let { query, logger, ctx } = init()
      expect(ctx._query).toBe(query)
      expect(ctx._logger).toBe(logger)
    })
  })
  describe('diff', () => {
    test('should work', () => {
      let { logger, ctx } = init()
      let ctx1 = {}
      let value = {}
      let actual = {}
      let returnValue = {}
      diff.mockReturnValueOnce(returnValue)
      expect(ctx.diff(ctx1, value, actual)).toBe(returnValue)
      expect(diff.mock.calls[0]).toEqual([ctx1, value, actual, true])
    })
  })
  describe('query', () => {
    test('should work', () => {
      let { query, ctx } = init()
      let path = '$$$$abc'
      let returnValue = {}
      query.mockReturnValueOnce(returnValue)
      expect(ctx.query(path)).toEqual(returnValue)
      expect(query.mock.calls[0]).toEqual([path, true])
    })
  })
  describe('error', () => {
    test('should work', () => {
      let { ctx, logger } = init()
      expect(ctx.error('msg')).toBe(false)
      expect(logger._msgs[0]).toBe('msg')
    })
  })
  describe('clearLog', () => {
    test('should work', () => {
      let { ctx, logger } = init()
      ctx.error('msg')
      expect(logger.dirty()).toBe(true)
      ctx.clearLog()
      expect(logger.dirty()).toBe(false)
    })
  })
  describe('hasError', () => {
    test('should work', () => {
      let { ctx, logger } = init()
      expect(ctx.hasError()).toBe(false)
      ctx.error('msg')
      expect(ctx.hasError()).toBe(true)
    })
  })
  describe('enter', () => {
    test('should work', () => {
      let { ctx, logger } = init()
      let scopedCtx = ctx.enter('scoped')
      expect(scopedCtx).toBeInstanceOf(ContextDiff)
      expect(scopedCtx._query).toBe(ctx._query)
      expect(scopedCtx._logger).toBe(logger.findChild('scoped'))
    })
  })
})

function init() {
  let query = jest.fn()
  let logger = new Logger()
  let ctx = new ContextDiff(query, logger)
  return { query, logger, ctx }
}
