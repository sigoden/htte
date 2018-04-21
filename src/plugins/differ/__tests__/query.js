const Context = require('../../../context-diff')
const Logger = require('../../../logger')

const Plugin = require('../query')

describe('test query differ', () => {
  test('log error if not find variable', () => {
    let logger = new Logger()
    let query = jest.fn().mockImplementation(() => undefined)
    let ctx = new Context(query, logger)
    let result = Plugin.handler(ctx, '$$$req.body.username', 'value')
    expect(result).toBe(false)
    expect(query).toHaveBeenCalled()
    expect(logger.toString()).toMatch('cannot find variable at')
  })
  test('return true if find variable and value is equal', () => {
    let logger = new Logger()
    let query = jest.fn().mockImplementation(v => 'value')
    let ctx = new Context(query, logger)
    let result = Plugin.handler(ctx, '$$$req.body.username', 'value')
    expect(result).toBe(true)
    expect(query).toHaveBeenCalled()
    expect(logger.dirty()).toBe(false)
  })
})
