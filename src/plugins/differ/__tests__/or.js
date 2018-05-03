const Context = require('../../../context-diff')
const Logger = require('../../../logger')

const Plugin = require('../or')

describe('test or differ', () => {
  test('log error if literal is not array', () => {
    let logger = new Logger()
    let ctx = new Context(jest.fn(), logger)
    let result = Plugin.handler(ctx, null, {})
    expect(result).toBe(false)
    expect(logger.toString()).toMatch('arguments must be array')
  })
  test('return ture if any element passes', () => {
    let logger = new Logger()
    let ctx = new Context(jest.fn(), logger)
    let result = Plugin.handler(ctx, ['3', 3], 3)
    expect(result).toBe(true)
  })
  test('no log if some element passes and some element fails', () => {
    let logger = new Logger()
    let ctx = new Context(jest.fn(), logger)
    let result = Plugin.handler(ctx, ['3', 3], 3)
    expect(logger.dirty()).toBe(false)
  })
  test('return false if none element passes', () => {
    let logger = new Logger()
    let ctx = new Context(jest.fn(), logger)
    let result = Plugin.handler(ctx, [4, '3'], 3)
    expect(result).toBe(false)
  })
})
