const App = require('../../app')
const { print } = require('../../utils')

module.exports = {
  command: ['run', '$0'],
  describe: 'run tests',
  builder: function(yargs) {
    return yargs
      .option('url', { description: 'api base url' })
      .option('timeout', { description: 'api request timeout' })
      .option('amend', { alias: 'a', description: 'start running from break position', boolean: true })
      .option('debug', { alias: 'd', description: 'print request and response', boolean: true })
      .option('unit', { alias: 'u', description: 'start running from specific unit' })
      .option('shot', { alias: 's', description: 'run one unit only', boolean: true })
      .option('bail', { alias: 'b', description: 'break when failed', boolean: true })
      .conflicts('amend', 'unit')
  },
  handler: function(argv) {
    let options = {
      configFile: argv.config,
      printFunc: print(process.env.DEBUG)
    }
    if (argv.url) options.url = argv.url
    if (argv.timeout) options.timeout = argv.timeout
    new App(options)
      .run(argv)
      .then(exitStatus => {
        process.exit(exitStatus)
      })
      .catch(err => {
        printFunc(err)
      })
  }
}
