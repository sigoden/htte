const App = require('../../app')
const { print } = require('../../utils')

module.exports = {
  command: ['run', '$0'],
  describe: 'run tests',
  builder: function(yargs) {
    return yargs
      .option('amend', { alias: 'a', description: 'starting test from latest breakpoint', boolean: true })
      .option('debug', { alias: 'd', description: 'dump the request and response data', boolean: true })
      .option('unit', { alias: 'u', description: 'starting test from specific unit' })
      .option('shot', { alias: 's', description: 'run one unit then stop', boolean: true })
      .option('bail', { alias: 'b', description: 'break when unit fails', boolean: true })
      .conflicts('amend', 'unit')
  },
  handler: function(argv) {
    new App(argv.config, print(process.env.DEBUG)).run(argv).then(exitStatus => {
      process.exit(exitStatus)
    })
  }
}
