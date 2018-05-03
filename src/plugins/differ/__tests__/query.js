const Context = require('../../../context-diff')
const Logger = require('../../../logger')

const Plugin = require('../query')

describe('test query differ', () => {
  test('log error if not find linked data', () => {
    let logger = new Logger()
    let query = jest.fn().mockImplementation(() => undefined)
    let ctx = new Context(query, logger)
    let result = Plugin.handler(ctx, '$$$req.body.username', 'value')
    expect(result).toBe(false)
    expect(query).toHaveBeenCalled()
    expect(logger.toString()).toMatch('cannot find linked data')
  })
  test('return true if find linked data and equal', () => {
    let logger = new Logger()
    let query = jest.fn().mockImplementation(v => 'value')
    let ctx = new Context(query, logger)
    let result = Plugin.handler(ctx, '$$$req.body.username', 'value')
    expect(result).toBe(true)
    expect(query).toHaveBeenCalled()
    expect(logger.dirty()).toBe(false)
  })
})
