const App = require('../../app')
const { print } = require('../../utils')

module.exports = {
  command: 'view',
  describe: 'view tests',
  builder: function(yargs) {
    return yargs
      .option('module', { alias: 'm', type: 'array', description: 'filter module' })
      .option('api', { alias: 'a', type: 'array', description: 'filter api' })
  },
  handler: function(argv) {
    new App(argv.config, print(process.env.DEBUG)).view(argv)
  }
}
