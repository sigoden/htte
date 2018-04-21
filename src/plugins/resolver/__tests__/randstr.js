const Context = require('../../../context-resolve')
const Logger = require('../../../logger')

const Plugin = require('../randstr')

describe('test randstr resolver', () => {
  test('return 6-char random string', () => {
    let logger = new Logger()
    let ctx = new Context(jest.fn(), logger)
    expect(Plugin.handler(ctx, null)).toMatch(/\w{6}/)
  })
  test('return random string in n-length', () => {
    let logger = new Logger()
    let ctx = new Context(jest.fn(), logger)
    expect(Plugin.handler(ctx, 10)).toMatch(/\w{10}/)
  })
  test('log error if argument length cannot parsed as int', () => {
    let logger = new Logger()
    let ctx = new Context(jest.fn(), logger)
    expect(Plugin.handler(ctx, 'abc')).toBeUndefined()
    expect(logger.toString()).toMatch('argument length must be integer')
  })
})
