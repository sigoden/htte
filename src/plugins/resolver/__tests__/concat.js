const Context = require('../../../context-resolve')
const Logger = require('../../../logger')

const Plugin = require('../concat')

describe('test concat resolver', () => {
  test('log error if literal is not array', () => {
    let logger = new Logger()
    let ctx = new Context(jest.fn(), logger)
    expect(Plugin.handler(ctx, {})).toBeUndefined()
    expect(logger.toString()).toMatch('arguments must be array')
  })
  test('concat the literal elements', () => {
    let logger = new Logger()
    let ctx = new Context(jest.fn(), logger)
    expect(Plugin.handler(ctx, ['a', 'b', 'c'])).toBe('abc')
  })
})
