const Context = require('../../../context-diff')
const Logger = require('../../../logger')

const Plugin = require('../array')

describe('test array differ', () => {
  test('log error if actual is not array', () => {
    let logger = new Logger()
    let ctx = new Context(jest.fn(), logger)
    let result = Plugin.handler(ctx, null, {})
    expect(result).toBe(false)
    expect(logger.toString()).toMatch('target must be array')
  })
  test('return true if arguments is null and target is array', () => {
    let logger = new Logger()
    let ctx = new Context(jest.fn(), logger)
    expect(Plugin.handler(ctx, null, [])).toBe(true)
    expect(Plugin.handler(ctx, null, ['a', 'b'])).toBe(true)
  })
  test('return true if partial elements pass ', () => {
    let logger = new Logger()
    let ctx = new Context(jest.fn(), logger)
    let literal = { 0: { a: 3 } }
    let actual = [{ a: 3 }, { b: 4 }]
    expect(Plugin.handler(ctx, literal, actual)).toBe(true)
  })
  test('able to diff array length', () => {
    let logger = new Logger()
    let ctx = new Context(jest.fn(), logger)
    let literal = { length: 2 }
    let actual = [{ a: 3 }, { b: 4 }]
    expect(Plugin.handler(ctx, literal, actual)).toBe(true)
  })
})
