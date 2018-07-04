const App = require('../../app')
const { print } = require('../../utils')

module.exports = {
  command: 'view',
  describe: 'view tests',
  builder: function(yargs) {
    return yargs
      .option('module', { alias: 'm', type: 'array', description: 'filter by module' })
      .option('api', { alias: 'a', type: 'array', description: 'filter by api' })
  },
  handler: function(argv) {
    let options = { configFile: argv.config, printFunc: print(process.env.DEBUG) }
    new App(options).view(argv)
  }
}
