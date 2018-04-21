const diff = require('../../src/diff')

describe('Test diff', () => {
  let context
  beforeEach(() => {
    context = { enter: jest.fn(), error: jest.fn().mockImplementation(() => false) }
  })
  describe('diff primitive', () => {
    test('return ture when value is primitive and same', () => {
      expect(diff(context, 3, 3)).toBe(true)
      expect(diff(context, true, true)).toBe(true)
      expect(diff(context, 'a', 'a')).toBe(true)
      expect(diff(context, null, null)).toBe(true)
      expect(diff(context, undefined, undefined)).toBe(true)
    })
    test('log error if primitive not equal', () => {
      expect(diff(context, '3', 3)).toBe(false)
      expect(context.error.mock.calls[0][0]).toMatch(`value diff`)
    })
  })
  describe('diff by function', () => {
    test('should work', () => {
      let value = jest.fn().mockImplementation(() => true)
      let actual = {}
      expect(diff(context, value, actual)).toBe(true)
      expect(value.mock.calls[0][0]).toBe(context)
      expect(value.mock.calls[0][1]).toBe(actual)
    })
    test('log error when function throw error', () => {
      let value = jest.fn().mockImplementation(() => {
        throw new Error()
      })
      let actual = {}
      expect(diff(context, value, actual)).toBe(false)
      expect(context.error.mock.calls[0][0]).toMatch(`cannot diff`)
    })
  })
  describe('diff array', () => {
    test('should work', () => {
      let value = ['a', 'b', 'c']
      let actual = ['a', 'b', 'c']
      expect(diff(context, value, actual)).toBe(true)
    })
    test('log error if actual is not array in strict mode', () => {
      let value = ['a', 'b', 'c']
      let actual = { 0: 'a', 1: 'b', 2: 'c' }
      expect(diff(context, value, actual)).toBe(false)
      expect(context.error.mock.calls[0][0]).toMatch(`type diff`)
    })
    test('should work if expect is part of actual in non-strict mode', () => {
      let value = ['a', 'b', 'c']
      let actual = ['a', 'b', 'c', 'd']
      expect(diff(context, value, actual, false)).toBe(true)
    })
    test('log error if expect and actual have different length', () => {
      let value = ['a', 'b', 'c']
      let actual = ['a', 'b', 'c', 'd']
      expect(diff(context, value, actual)).toBe(false)
    })
  })
  describe('diff object', () => {
    test('should work', () => {
      let value = { a: 'a', b: 'b' }
      let actual = { a: 'a', b: 'b' }
      expect(diff(context, value, actual)).toBe(true)
    })
    test('should work if expect is part of actual in non-strict mode', () => {
      let value = { a: 'a' }
      let actual = { a: 'a', b: 'b' }
      expect(diff(context, value, actual, false)).toBe(true)
    })
    test('log error if actual is not object', () => {
      let value = { a: 'a', b: 'b' }
      let actual = ['a', 'b']
      expect(diff(context, value, actual)).toBe(false)
      expect(context.error.mock.calls[0][0]).toMatch('type diff')
    })
    test('log error if actual and expect have different property', () => {
      let value = { a: 'a', c: 'c' }
      let actual = { a: 'a', b: 'b' }
      expect(diff(context, value, actual)).toBe(false)
      expect(context.error.mock.calls[0][0]).toMatch('props diff')
    })
  })
})
