const createQuery = require('../../src/query-variable')

describe('Test query', () => {
  describe('cross-module variable', () => {
    test('should work', () => {
      let unitVars = { module1: { unit1: { req: { body: { msg: 'a' } } } } }
      let unit = {
        module: () => 'module',
        name: () => 'unit',
        dependencies: () => [{ name: 'mymodule', module: 'module1' }]
      }
      let query = createQuery(unitVars, {}, unit)
      expect(query('$mymodule.unit1.req.body.msg')).toEqual('a')
      expect(query('$mymodule.unit1.req.body.msg', true)).toEqual('a')
      expect(query('$mymodule.unit1.req.body.msg', false)).toEqual(['a'])
    })
    test('should fail when module is not in the unit dependencies', () => {
      let unitVars = { module1: { unit1: { req: { body: { msg: 'a' } } } } }
      let unit = {
        module: () => 'module',
        name: () => 'unit',
        dependencies: () => []
      }
      let query = createQuery(unitVars, {}, unit)
      expect(query('$module1.unit1.req.body.msg')).toBeUndefined()
      expect(query('$module1.unit1.req.body.msg', false)).toEqual([])
    })
  })
  describe('module variable', () => {
    test('should work', () => {
      let unitVars = { module: { unit: { req: { body: { msg: 'a' } } } } }
      let unit = {
        module: () => 'module',
        name: () => 'unit',
        dependencies: () => []
      }
      let query = createQuery(unitVars, {}, unit)
      expect(query('$$unit.req.body.msg')).toBe('a')
    })
  })
  describe('unit variable', () => {
    test('should work', () => {
      let unitVars = { module: { unit: { req: { body: { msg: 'a' } } } } }
      let unit = {
        module: () => 'module',
        name: () => 'unit',
        dependencies: () => []
      }
      let query = createQuery(unitVars, {}, unit)
      expect(query('$$$req.body.msg')).toBe('a')
    })
  })
  describe('global variable', () => {
    test('should work', () => {
      let unit = {
        module: () => 'module',
        name: () => 'unit',
        dependencies: () => []
      }
      let globalVars = { setting: { token: 'abc' } }
      let query = createQuery({}, globalVars, unit)
      expect(query('$$$$setting.token')).toBe('abc')
    })
  })
  describe('misc', () => {
    let unit = {
      module: () => 'module',
      name: () => 'unit',
      dependencies: () => []
    }
    let query = createQuery({}, {}, unit)
    test('return the origin value if not string', () => {
      ;[3, { a: 3 }, ['a']].forEach(v => {
        expect(query(v)).toEqual(v)
      })
    })
    test(`return the origin value if string do not match variable regexp`, () => {
      expect(query('a')).toEqual('a')
      expect(query('[a]')).toEqual('[a]')
    })
    test('should work with square bracket', () => {
      let unitVars = { module1: { unit1: { req: { body: { '.content': 'a' } } } } }
      let unit = {
        module: () => 'module',
        name: () => 'unit',
        dependencies: () => [{ name: 'mymodule', module: 'module1' }]
      }
      let query = createQuery(unitVars, {}, unit)
      expect(query('$mymodule.unit1.req.body[".content"]')).toEqual('a')
    })
    test('should work when module name do not match variable regexp', () => {
      let unitVars = { module1: { unit1: { req: { body: { '.content': 'a' } } } } }
      let unit = {
        module: () => 'module',
        name: () => 'unit',
        dependencies: () => [{ name: 'mymodule.a', module: 'module1' }]
      }
      let query = createQuery(unitVars, {}, unit)
      expect(query('$["mymodule.a"].unit1.req.body[".content"]')).toEqual('a')
    })
    test('return undefined if jsonpath is not valid', () => {
      let unitVars = { module1: { unit1: { req: { body: { '.content': 'a' } } } } }
      let unit = {
        module: () => 'module',
        name: () => 'unit',
        dependencies: () => [{ name: 'mymodule', module: 'module1' }]
      }
      let query = createQuery(unitVars, {}, unit)
      expect(query('$mymodule.unit1.req.body[".content"')).toBeUndefined()
    })
  })
})
