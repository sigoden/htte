module.exports = config => {
  return {
    name: 'test1',
    contentType: () => 'application/test1',
    acceptType: type => 'application/test1' === type,
    serialize: data => JSON.stringify(data),
    deserialize: data => JSON.parse(data)
  }
}
