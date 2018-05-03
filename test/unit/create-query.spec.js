const createQuery = require('../../src/create-query')

describe('Test query', () => {
  describe('cross-module linked data', () => {
    test('should retrive cross-module linked data', () => {
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
  describe('crruent-module linked data', () => {
    test('should retrive crruent-module linked data', () => {
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
  describe('current-unit linked data', () => {
    test('should retrive current-unit linked data', () => {
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
  describe('linked configData', () => {
    test('should retrive linked config data', () => {
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
    test('return the path itself if path is not string', () => {
      ;[3, { a: 3 }, ['a']].forEach(v => {
        expect(query(v)).toEqual(v)
      })
    })
    test(`return the path itself if path is not a link`, () => {
      expect(query('a')).toEqual('a')
      expect(query('[a]')).toEqual('[a]')
    })
    test('should retrive data when path has square bracket', () => {
      let unitVars = { module1: { unit1: { req: { body: { '.content': 'a' } } } } }
      let unit = {
        module: () => 'module',
        name: () => 'unit',
        dependencies: () => [{ name: 'mymodule', module: 'module1' }]
      }
      let query = createQuery(unitVars, {}, unit)
      expect(query('$mymodule.unit1.req.body[".content"]')).toEqual('a')
    })
    test('should retrive data when module name is complex', () => {
      let unitVars = { module1: { unit1: { req: { body: { '.content': 'a' } } } } }
      let unit = {
        module: () => 'module',
        name: () => 'unit',
        dependencies: () => [{ name: 'mymodule.a', module: 'module1' }]
      }
      let query = createQuery(unitVars, {}, unit)
      expect(query('$["mymodule.a"].unit1.req.body[".content"]')).toEqual('a')
    })
    test('return undefined if path is not valid', () => {
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
