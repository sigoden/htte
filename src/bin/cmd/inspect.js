const App = require('../../app')
const { print } = require('../../utils')

module.exports = {
  command: 'inspect [unit]',
  describe: 'inspect unit',
  builder: function(yargs) {
    return yargs.positional('unit', { describe: 'id of unit', type: 'string' })
  },
  handler: function(argv) {
    new App(argv.config, print(process.env.DEBUG)).inspect(argv)
  }
}
