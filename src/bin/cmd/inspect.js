const App = require('../../app')
const { print } = require('../../utils')

module.exports = {
  command: 'inspect [unit]',
  describe: 'print all relevant information about the unit',
  builder: function(yargs) {
    return yargs.positional('unit', { describe: 'unit id', type: 'string' })
  },
  handler: function(argv) {
    new App(argv.config, print(process.env.DEBUG)).inspect(argv)
  }
}
