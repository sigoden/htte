const resolve = require('../../src/resolve')

describe('Test resolve', () => {
  let context
  beforeEach(() => {
    context = { enter: jest.fn(), error: jest.fn() }
  })
  test('return the input when value is primitive', () => {
    expect(resolve(context, 3)).toBe(3)
    expect(resolve(context, true)).toBe(true)
    expect(resolve(context, 'abc')).toBe('abc')
    expect(resolve(context, null)).toBeNull()
    expect(resolve(context, undefined)).toBeUndefined()
  })
  test('execute value if value is function', () => {
    let value = jest.fn().mockImplementation(v => v)
    expect(resolve(context, value)).toBe(context)
    expect(value.mock.calls[0][0]).toBe(context)
  })
  test('log error if value fail to execute', () => {
    let value = jest.fn().mockImplementation(v => {
      throw new Error()
    })
    expect(resolve(context, value)).toBeUndefined()
    expect(context.error.mock.calls[0][0]).toMatch('cannot resolve value')
  })
  test('map each element if value is array', () => {
    let value = ['a', 'b', 'c']
    expect(resolve(context, value)).toEqual(value)
    expect(context.enter.mock.calls).toHaveLength(3)
    expect(context.enter.mock.calls[0][0]).toBe('[0]')
  })
  test('iterate each property if value is object', () => {
    let value = { a: 1, b: 2, c: 3 }
    expect(resolve(context, value)).toEqual(value)
    expect(context.enter.mock.calls).toHaveLength(3)
    expect(context.enter.mock.calls[0][0]).toBe('a')
  })
})
