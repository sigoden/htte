const Context = require('../../../context-diff')
const Logger = require('../../../logger')

const Plugin = require('../and')

describe('test and differ', () => {
  test('log error if literal is not array', () => {
    let logger = new Logger()
    let ctx = new Context(jest.fn(), logger)
    let result = Plugin.handler(ctx, null, {})
    expect(result).toBe(false)
    expect(logger.toString()).toMatch('arguments must be array')
  })
  test('return ture if all sub diff passed', () => {
    let logger = new Logger()
    let ctx = new Context(jest.fn(), logger)
    let result = Plugin.handler(ctx, [3, 3], 3)
    expect(result).toBe(true)
  })
  test('return false if any diff not passed', () => {
    let logger = new Logger()
    let ctx = new Context(jest.fn(), logger)
    let result = Plugin.handler(ctx, [3, '3'], 3)
    expect(result).toBe(false)
    expect(logger.toString()).toMatch('value diff')
  })
})
