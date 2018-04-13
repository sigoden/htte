const App = require('../app')

module.exports = {
  command: 'inspect [options] [unit]',
  describe: 'inspect specific unit',
  buidler: function(yargs) {
    return yargs
      .option('ammend', { alias: 'a', description: 'last failed unit', boolean: true })
      .positional('unit', { describe: 'specific unit', type: 'string' })
  },
  handler: function(argv) {
    new App(argv.config).inspect(argv)
  }
}
