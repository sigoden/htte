const createJSONSerializer = require('../../../src/serializers/json')

describe('Test JSON', () => {
  test('serialize', () => {
    let serializer = createJSONSerializer()
    expect(serializer.serialize({ a: 3, b: '4' })).toEqual(`{"a":3,"b":"4"}`)
  })
  test('deserialize', () => {
    let serializer = createJSONSerializer()
    expect(serializer.deserialize(`{"a":3,"b":"4"}`)).toEqual({ a: 3, b: '4' })
  })
  test('contentType', () => {
    let serializer = createJSONSerializer()
    expect(serializer.contentType()).toEqual('application/json')
    let serializer2 = createJSONSerializer({ contentType: { charset: 'utf-8' } })
    expect(serializer2.contentType()).toEqual('application/json; charset=utf-8')
  })
  test('acceptType', () => {
    let serializer = createJSONSerializer()
    expect(serializer.acceptType('application/json')).toEqual(true)
    let serializer2 = createJSONSerializer()
    expect(serializer2.acceptType('application/xml')).toEqual(false)
  })
})
