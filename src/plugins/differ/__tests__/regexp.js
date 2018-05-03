const Context = require('../../../context-diff')
const Logger = require('../../../logger')

const Plugin = require('../regexp')

describe('test regexp differ', () => {
  test('return true if actual matchs regexp', () => {
    let logger = new Logger()
    let ctx = new Context(jest.fn(), logger)
    expect(Plugin.handler(ctx, 'abc', 'abc')).toBe(true)
    expect(Plugin.handler(ctx, '/abc/', 'abc')).toBe(true)
    expect(Plugin.handler(ctx, '/\\w+/i', 'abc')).toBe(true)
    expect(Plugin.handler(ctx, '/i', 'abc')).toBe(true)
    expect(Plugin.handler(ctx, '/abc', '/abc')).toBe(true)
  })
  test('log error if actual is not string', () => {
    let logger = new Logger()
    let ctx = new Context(jest.fn(), logger)
    expect(Plugin.handler(ctx, '333', 333)).toBe(false)
    expect(logger.toString()).toMatch('target must be string')
  })
  test('log error if actual does not match regexp', () => {
    let logger = new Logger()
    let ctx = new Context(jest.fn(), logger)
    expect(Plugin.handler(ctx, 'ac', 'abc')).toBe(false)
    expect(logger.toString()).toMatch('do not match regexp')
  })
})
