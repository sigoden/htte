const SerializerManager = require('../../src/serializer-manager')
const createJSONSerializer = require('../../src/serializers/json')
const createXMLSerializer = require('../../src/serializers/xml')

describe('Test SerializerManager', () => {
  describe('regist', () => {
    let manager = SerializerManager()
    test('should regist serializer', () => {
      expect(() => manager.regist(createJSONSerializer())).not.toThrow()
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
    test('throw if serialize or deserialize is not function', () => {
      let serializer1 = createXMLSerializer()
      serializer1.name = 'serializer1'
      serializer1.serialize = ''
      expect(() => manager.regist(serializer1)).toThrow(`serializer1: serialize or deserialize must be function`)
      let serializer2 = createXMLSerializer()
      serializer2.name = 'serializer2'
      serializer2.deserialize = ''
      expect(() => manager.regist(serializer2)).toThrow(`serializer2: serialize or deserialize must be function`)
    })
    test('throw if acceptType or contentType is not function', () => {
      let serializer1 = createXMLSerializer()
      serializer1.name = 'serializer1'
      serializer1.acceptType = ''
      expect(() => manager.regist(serializer1)).toThrow(`serializer1: acceptType or contentType must be function`)
      let serializer2 = createXMLSerializer()
      serializer2.name = 'serializer2'
      serializer2.contentType = ''
      expect(() => manager.regist(serializer2)).toThrow(`serializer2: acceptType or contentType must be function`)
    })
  })
  describe('names', () => {
    test('should return registed plugins name', () => {
      let manager = SerializerManager()
      expect(manager.names()).toEqual([])
      manager.regist(createJSONSerializer())
      expect(manager.names()).toEqual(['json'])
    })
  })
  describe('findByName', () => {
    test('should find plugin by name', () => {
      let manager = SerializerManager()
      let serializer = createJSONSerializer()
      manager.regist(serializer)
      expect(manager.findByName(serializer.name)).toEqual(serializer)
    })
    test('return undefined if plugin is not found', () => {
      let manager = SerializerManager()
      let serializer = createJSONSerializer()
      expect(manager.findByName(serializer.name)).toBeUndefined()
    })
  })
  describe('findByType', () => {
    test('should find plugin by type', () => {
      let manager = SerializerManager()
      let serializer = createJSONSerializer()
      manager.regist(serializer)
      expect(manager.findByType('application/json')).toEqual(serializer)
    })
    test('return undefined if plugin is not found', () => {
      let manager = SerializerManager()
      expect(manager.findByType('application/json')).toBeUndefined()
    })
  })
})
