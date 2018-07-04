const Context = require('../../../context-resolve')
const Logger = require('../../../logger')

const Plugin = require('../jsonarray')

describe('test jsonarray resolver', () => {
  test('return json stringified data of array', () => {
    let logger = new Logger()
    let ctx = new Context(jest.fn(), logger)
    expect(Plugin.handler(ctx, ['a', 'b', 'c'])).toBe('["a","b","c"]')
  })
})
