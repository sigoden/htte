const createXMLSerializer = require('../../../src/serializers/xml')

describe('Test XML', () => {
  test('serialize', () => {
    let serializer = createXMLSerializer()
    expect(serializer.serialize({ a: 3, b: '4' })).toEqual(`<a>3</a><b>4</b>`)
  })
  test('deserialize', () => {
    let serializer = createXMLSerializer()
    expect(serializer.deserialize(`<a>3</a><b>4</b>`)).toEqual({ a: 3, b: 4 })
  })
  test('contentType', () => {
    let serializer = createXMLSerializer()
    expect(serializer.contentType()).toEqual('application/xml')
    let serializer2 = createXMLSerializer({ contentType: { charset: 'utf-8' } })
    expect(serializer2.contentType()).toEqual('application/xml; charset=utf-8')
  })
  test('acceptType', () => {
    let serializer = createXMLSerializer()
    expect(serializer.acceptType('application/xml')).toEqual(true)
    expect(serializer.acceptType('text/xml')).toEqual(true)
    let serializer2 = createXMLSerializer()
    expect(serializer2.acceptType('application/jon')).toEqual(false)
  })
})
