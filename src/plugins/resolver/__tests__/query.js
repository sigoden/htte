const Context = require('../../../context-resolve')
const Logger = require('../../../logger')

const Plugin = require('../query')

describe('test query resolver', () => {
  test('return linked data', () => {
    let logger = new Logger()
    let query = jest.fn().mockImplementation(() => 'value')
    let ctx = new Context(query, logger)
    expect(Plugin.handler(ctx, '$$$req.body.username')).toBe('value')
    expect(query).toHaveBeenCalled()
  })
  test('log error if linked data is not found', () => {
    let logger = new Logger()
    let query = jest.fn().mockImplementation(() => undefined)
    let ctx = new Context(query, logger)
    expect(Plugin.handler(ctx, '$$$req.body.username')).toBeUndefined()
    expect(logger.toString()).toMatch('cannot find linked data at')
  })
})
