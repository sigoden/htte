const path = require('path')
const os = require('os')

module.exports = {
  resolveFixtureFile: file => {
    return path.join(__dirname, '../fixtures', file)
  }
}
