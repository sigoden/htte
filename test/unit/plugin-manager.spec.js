const PluginManager = require('../../src/plugin-manager')
const yaml = require('js-yaml')
const ContextResolve = require('../../src/context-resolve')
const ContextDiff = require('../../src/context-diff')
const Logger = require('../../src/logger')

const queryDiffer = {
  name: 'query',
  kind: 'scalar',
  type: 'differ',
  handler: jest.fn()
}

const queryResolver = {
  name: 'query',
  kind: 'scalar',
  type: 'resolver',
  handler: jest.fn()
}

describe('Test PluginManager', () => {
  describe('regist', () => {
    let manager = PluginManager()
    test('should regist plugin', () => {
      expect(() => manager.regist(queryDiffer)).not.toThrow()
    })
    test('throw if plugin is not object', () => {
      expect(() => manager.regist()).toThrow('argument is not valid')
    })
    test('throw if plugin have no property name', () => {
      expect(() => manager.regist({})).toThrow('name must be a string')
      expect(() => manager.regist({ name: null })).toThrow('name must be a string')
    })
    test('throw if plugin name already existed', () => {
      expect(() => manager.regist({ name: 'query', type: 'differ' })).toThrow('query: plugin conflict')
    })
    test('different plugin type can have same name', () => {
      expect(() => manager.regist(queryResolver)).not.toThrow()
    })
    test('throw if plugin type is undefined or is not one of resolver, differ', () => {
      expect(() => manager.regist({ name: 'object' })).toThrow('type must be one of')
      expect(() => manager.regist({ name: 'object', type: 'diff' })).toThrow('type must be one of')
    })
    test('throw if plugin kind is undefined or is not one of scalar, mapping, sequence', () => {
      expect(() => manager.regist({ name: 'object', type: 'differ', kind: 'maping' })).toThrow(
        'object: kind must be one of '
      )
    })
    test('throw if plugin handler is undefined or is not function', () => {
      expect(() => manager.regist({ name: 'object', type: 'differ', kind: 'mapping', handler: null })).toThrow(
        'object: handler must be function'
      )
    })
  })
  describe('names', () => {
    test('return names of plugins', () => {
      let manager = PluginManager()
      manager.regist(queryDiffer)
      manager.regist(queryResolver)
      let result = manager.names()
      expect(result).toEqual(['!@query', '!$query'])
    })
  })
  describe('list', () => {
    test('return array of plugins', () => {
      let manager = PluginManager()
      manager.regist(queryDiffer)
      manager.regist(queryResolver)
      let result = manager.list()
      expect(result).toHaveLength(2)
      expect(result[0]).toBeInstanceOf(yaml.Type)
      expect(result[0].tag).toBe('!@query')
      expect(result[0].kind).toBe('scalar')
      expect(result[1].tag).toBe('!$query')
    })
  })
  describe('yaml.Tag.construct', () => {
    let manager = PluginManager()
    queryDiffer.handler = jest.fn().mockImplementation(v => v)
    queryResolver.handler = jest.fn().mockImplementation(v => v)
    manager.regist(queryDiffer)
    manager.regist(queryResolver)
    let types = manager.list()
    let contextDiff, contextResolve, diffHanler, resolveHanlder
    beforeEach(() => {
      contextDiff = new ContextDiff(() => {}, new Logger('keyToDiff'))
      contextResolve = new ContextResolve(() => {}, new Logger('keyToResolve'))
      diffHanler = types[0].construct
      resolveHanlder = types[1].construct
    })
    test('should be called with proper arguments', () => {
      let literal = {}
      let actual = {}
      let diffResult = diffHanler(literal)(contextDiff, actual)
      expect(diffResult).toBe(contextDiff)
      expect(queryDiffer.handler.mock.calls[0][0]).toBe(contextDiff)
      expect(queryDiffer.handler.mock.calls[0][1]).toBe(literal)
      expect(queryDiffer.handler.mock.calls[0][2]).toBe(actual)
      let resolvResult = resolveHanlder(literal)(contextResolve)
      expect(resolvResult).toBe(contextResolve)
      expect(queryResolver.handler.mock.calls[0][0]).toBe(contextResolve)
      expect(queryResolver.handler.mock.calls[0][1]).toEqual(contextResolve.resolve(contextResolve, literal))
    })
    test('log error when use differ plugin in resolver context', () => {
      let literal = {}
      let actual = {}
      diffHanler(literal)(contextResolve, actual)
      expect(contextResolve._logger.toString()).toBe(`keyToResolve:
  use differ plugin in resolver context
`)
    })
    test('log error when use resolver plugin in diff context', () => {
      let literal = {}
      resolveHanlder(literal)(contextDiff)
      expect(contextDiff._logger.toString()).toBe(`keyToDiff:
  use resolver plugin in differ context
`)
    })
    test('throw error when context is not valid', () => {
      let literal = {}
      expect(() => resolveHanlder(literal)({})).toThrow('context is not valid')
    })
    test('log error when literal is function and throws error', () => {
      let literal = [
        () => {
          throw new Error()
        }
      ]
      let resolvResult = resolveHanlder(literal)(contextResolve)
      expect(resolvResult).toBeUndefined()
      expect(contextResolve.hasError()).toBe(true)
    })
  })
})
