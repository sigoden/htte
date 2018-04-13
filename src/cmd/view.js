const App = require('../app')

module.exports = {
  command: ['view [options]'],
  describe: 'view units',
  buidler: function(yargs) {
    return yargs
      .option('module', { alias: 'm', type: 'array', description: 'filter module' })
      .option('api', { alias: 'a', type: 'array', description: 'filter api' })
  },
  handler: function(argv) {
    new App(argv.config).view(argv)
  }
}
