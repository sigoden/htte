module.exports = {
  name: 'json',
  type: 'application/json',
  serialize: object => JSON.stringify(object),
  deserialize: data => JSON.parse(data)
}
