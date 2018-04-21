const Context = require('../../../context-diff')
const Logger = require('../../../logger')

const Plugin = require('../exist')

describe('test exist differ', () => {
  test('return true if literal is defined', () => {
    let logger = new Logger()
    let ctx = new Context(jest.fn(), logger)
    expect(Plugin.handler(ctx, null, '')).toBe(true)
  })
  test('return false if literal is undefined', () => {
    let logger = new Logger()
    let ctx = new Context(jest.fn(), logger)
    expect(Plugin.handler(ctx, null)).toBe(false)
    expect(logger.toString()).toMatch('property do not exist')
  })
})
