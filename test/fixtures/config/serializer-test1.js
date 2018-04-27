module.exports = {
  name: 'test1',
  type: 'application/test1',
  serialize: data => JSON.stringify(data),
  deserialize: data => JSON.parse(data)
}
