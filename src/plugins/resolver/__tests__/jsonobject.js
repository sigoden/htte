const Context = require('../../../context-resolve')
const Logger = require('../../../logger')

const Plugin = require('../jsonobject')

describe('test jsonobject resolver', () => {
  test('return json stringified data of array', () => {
    let logger = new Logger()
    let ctx = new Context(jest.fn(), logger)
    expect(Plugin.handler(ctx, { a: 3, b: 4 })).toBe('{"a":3,"b":4}')
  })
})
