const path = require('path')
const os = require('os')

module.exports = {
  resolveFixtureFile: file => {
    return path.join(__dirname, '../fixtures', file)
  },
  dataTemplate: {
    object: { key: 'value' },
    objectEmpty: {},
    string: 'abc',
    stringEmpty: '',
    number: 3.2,
    nubmerZero: 0,
    boolean: true,
    array: ['a', 'b', 'c'],
    arrayEmpty: [],
    null: null
  }
}
