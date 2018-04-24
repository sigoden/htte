const App = require('../../app')
const { print } = require('../../utils')

module.exports = {
  command: 'inspect [unit]',
  describe: 'inspect specific test unit',
  builder: function(yargs) {
    return yargs.positional('unit', { describe: 'unit name', type: 'string' })
  },
  handler: function(argv) {
    new App(argv.config, print(process.env.DEBUG)).inspect(argv)
  }
}
