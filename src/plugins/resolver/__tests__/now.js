const Context = require('../../../context-resolve')
const Logger = require('../../../logger')

const Plugin = require('../now')

describe('test now resolver', () => {
  test('return current time', () => {
    let logger = new Logger()
    let ctx = new Context(jest.fn(), logger)
    expect(Plugin.handler(ctx, null)).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/)
  })
  test('return offested datetime', () => {
    let logger = new Logger()
    let ctx = new Context(jest.fn(), logger)
    let timestr = Plugin.handler(ctx, '-86400000')
    expect(Date.now() - Date.parse(timestr) >= 86400000).toBe(true)
  })
  test('log error if offset can not parsed as integer', () => {
    let logger = new Logger()
    let ctx = new Context(jest.fn(), logger)
    Plugin.handler(ctx, 'abc')
    expect(logger.toString()).toMatch('argument offset must be integer')
  })
})
