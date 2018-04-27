module.exports = {
  name: 'json',
  type: 'application/json',
  serialize: data => JSON.stringify(data),
  deserialize: data => JSON.parse(data)
}
