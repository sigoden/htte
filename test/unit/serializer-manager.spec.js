const SerializerManager = require('../../src/serializer-manager')
const JSONSerializer = require('../../src/serializers/json')

describe('Test SerializerManager', () => {
  describe('regist', () => {
    let manager = SerializerManager()
    test('should work', () => {
      expect(() => manager.regist(JSONSerializer)).not.toThrow()
    })
    test('argument must be object', () => {
      expect(() => manager.regist()).toThrow('argument is not valid')
    })
    test('argument of plugin must have property name and it should be string', () => {
      expect(() => manager.regist({})).toThrow('name must be a string')
      expect(() => manager.regist({ name: null })).toThrow('name must be a string')
    })
    test('name conflict', () => {
      expect(() => manager.regist({ name: 'json' })).toThrow('json: serializer conflict')
    })
    test('argument of plugin must have property type and it should be string', () => {
      expect(() => manager.regist({ name: 'xml' })).toThrow('type must be a string')
      expect(() => manager.regist({ name: 'xml', type: null })).toThrow('type must be a string')
    })
    test('type conflict', () => {
      expect(() => manager.regist({ name: 'xml', type: 'application/json' })).toThrow(
        'xml: already exist serializer with type application/json'
      )
    })
    test('argument of plugin must have property serialize and deserialize and they should be function', () => {
      expect(() => manager.regist({ name: 'xml', type: 'application/xml', serialize: '', deserialize: '' })).toThrow(
        `xml: serialize or deserialize must be function`
      )
      expect(() => manager.regist({ name: 'xml', type: 'application/xml', serialize: () => {} })).toThrow(
        `xml: serialize or deserialize must be function`
      )
      expect(() => manager.regist({ name: 'xml', type: 'application/xml', deserialize: () => {} })).toThrow(
        `xml: serialize or deserialize must be function`
      )
    })
  })
  describe('names', () => {
    test('should return registed plugins name', () => {
      let manager = SerializerManager()
      expect(manager.names()).toEqual([])
      manager.regist(JSONSerializer)
      expect(manager.names()).toEqual(['json'])
    })
  })
  describe('findByName', () => {
    test('should find plugin by name', () => {
      let manager = SerializerManager()
      manager.regist(JSONSerializer)
      expect(manager.findByName(JSONSerializer.name)).toEqual(JSONSerializer)
    })
    test('return undefined if not find', () => {
      let manager = SerializerManager()
      expect(manager.findByName(JSONSerializer.name)).toBeUndefined()
    })
  })
  describe('findByType', () => {
    test('should find plugin by type', () => {
      let manager = SerializerManager()
      manager.regist(JSONSerializer)
      expect(manager.findByType(JSONSerializer.type)).toEqual(JSONSerializer)
    })
    test('return undefined if not find', () => {
      let manager = SerializerManager()
      expect(manager.findByType(JSONSerializer.type)).toBeUndefined()
    })
  })
})
