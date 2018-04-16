const App = require('../app')

module.exports = {
  command: ['run', '$0'],
  describe: 'run tests',
  builder: function(yargs) {
    return yargs
      .option('amend', { alias: 'a', description: 'whether to continue from last failed unit', boolean: true })
      .option('debug', { alias: 'd', description: 'whether dump req and res when failed', boolean: true })
      .option('unit', { alias: 'u', description: 'the name of unit to run' })
      .option('shot', { alias: 's', description: 'run only specific unit then stop', boolean: true })
      .option('bail', { alias: 'b', description: 'whether to stop at failed unit', boolean: true })
      .conflicts('amend', 'unit')
  },
  handler: function(argv) {
    new App(argv.config).run(argv)
  }
}
