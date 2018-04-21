const Context = require('../../../context-diff')
const Logger = require('../../../logger')

const Plugin = require('../object')

describe('test object differ', () => {
  test('log error if actual is not object', () => {
    let logger = new Logger()
    let ctx = new Context(jest.fn(), logger)
    let result = Plugin.handler(ctx, null, [])
    expect(result).toBe(false)
    expect(logger.toString()).toMatch('target must be object')
  })
  test('return true if arguments is null and target is object', () => {
    let logger = new Logger()
    let ctx = new Context(jest.fn(), logger)
    expect(Plugin.handler(ctx, null, {})).toBe(true)
    expect(Plugin.handler(ctx, null, { a: 3 })).toBe(true)
  })
  test('return true if partial properties pass ', () => {
    let logger = new Logger()
    let ctx = new Context(jest.fn(), logger)
    let literal = { a: 3 }
    let actual = { a: 3, b: 4 }
    expect(Plugin.handler(ctx, literal, actual)).toBe(true)
  })
})
