const SerializerManager = require('../../src/serializer-manager')
const JSONSerializer = require('../../src/serializers/json')

describe('Test SerializerManager', () => {
  describe('regist', () => {
    let manager = SerializerManager()
    test('should regist serializer', () => {
      expect(() => manager.regist(JSONSerializer)).not.toThrow()
    })
    test('throw if serializer is not object', () => {
      expect(() => manager.regist()).toThrow('argument is not valid')
    })
    test('throw if serializer have no property name', () => {
      expect(() => manager.regist({})).toThrow('name must be a string')
      expect(() => manager.regist({ name: null })).toThrow('name must be a string')
    })
    test('throw if serializer name already existed', () => {
      expect(() => manager.regist({ name: 'json' })).toThrow('json: serializer conflict')
    })
    test('throw if serializer type is not string', () => {
      expect(() => manager.regist({ name: 'xml' })).toThrow('type must be a string')
      expect(() => manager.regist({ name: 'xml', type: null })).toThrow('type must be a string')
    })
    test('throw if serializer type already existed', () => {
      expect(() => manager.regist({ name: 'xml', type: 'application/json' })).toThrow(
        'xml: already exist serializer with type application/json'
      )
    })
    test('throw if serialize or deserialize is not function', () => {
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
    test('return undefined if plugin is not found', () => {
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
    test('return undefined if plugin is not found', () => {
      let manager = SerializerManager()
      expect(manager.findByType(JSONSerializer.type)).toBeUndefined()
    })
  })
})
