const JSONSerializer = require('../../../src/serializers/json')

describe('Test JSON', () => {
  test('serialize', () => {
    expect(JSONSerializer.serialize({ a: 3, b: '4' })).toEqual(`{"a":3,"b":"4"}`)
  })
  test('deserialize', () => {
    expect(JSONSerializer.deserialize(`{"a":3,"b":"4"}`)).toEqual({ a: 3, b: '4' })
  })
})
