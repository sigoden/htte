const diff = require('../../src/diff')

describe('Test diff', () => {
  let context
  beforeEach(() => {
    context = { enter: jest.fn(), error: jest.fn().mockImplementation(() => false) }
  })
  describe('diff primitive', () => {
    test('return ture when value is same primitive', () => {
      expect(diff(context, 3, 3)).toBe(true)
      expect(diff(context, true, true)).toBe(true)
      expect(diff(context, 'a', 'a')).toBe(true)
      expect(diff(context, null, null)).toBe(true)
      expect(diff(context, undefined, undefined)).toBe(true)
    })
    test('log error if the primitive is not equal', () => {
      expect(diff(context, '3', 3)).toBe(false)
      expect(context.error.mock.calls[0][0]).toBe(`value diff, "3" ≠ 3`)
    })
  })
  describe('diff by function', () => {
    test('return true when the function return true', () => {
      let value = jest.fn().mockImplementation(() => true)
      let actual = {}
      expect(diff(context, value, actual)).toBe(true)
      expect(value.mock.calls[0][0]).toBe(context)
      expect(value.mock.calls[0][1]).toBe(actual)
    })
    test('log error when the function throw error', () => {
      let value = jest.fn().mockImplementation(() => {
        throw new Error('something wrong')
      })
      let actual = {}
      expect(diff(context, value, actual)).toBe(false)
      expect(context.error.mock.calls[0][0]).toMatch(`cannot diff, Error: something wrong`)
    })
  })
  describe('diff array', () => {
    test('should diff array', () => {
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
    test('return true if the expect is subset of the actual in non-strict mode', () => {
      let value = ['a', 'b', 'c']
      let actual = ['a', 'b', 'c', 'd']
      expect(diff(context, value, actual, false)).toBe(true)
    })
    test('log error if the expect and the actual have different length in strict mode', () => {
      let value = ['a', 'b', 'c']
      let actual = ['a', 'b', 'c', 'd']
      expect(diff(context, value, actual)).toBe(false)
      expect(context.error.mock.calls[0][0]).toBe(`size diff, 3 ≠ 4`)
    })
  })
  describe('diff object', () => {
    test('should diff object', () => {
      let value = { a: 'a', b: 'b' }
      let actual = { a: 'a', b: 'b' }
      expect(diff(context, value, actual)).toBe(true)
    })
    test('should work if the expect is subset of the actual in non-strict mode', () => {
      let value = { a: 'a' }
      let actual = { a: 'a', b: 'b' }
      expect(diff(context, value, actual, false)).toBe(true)
    })
    test('log error if the actual is not object', () => {
      let value = { a: 'a', b: 'b' }
      let actual = ['a', 'b']
      expect(diff(context, value, actual)).toBe(false)
      expect(context.error.mock.calls[0][0]).toMatch('type diff')
    })
    test('log error if the actual and the expect have different properties', () => {
      let value = { a: 'a', c: 'c' }
      let actual = { a: 'a', b: 'b' }
      expect(diff(context, value, actual)).toBe(false)
      expect(context.error.mock.calls[0][0]).toBe('props diff, ++ c, -- b')
    })
  })
})
