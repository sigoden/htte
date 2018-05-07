#!/usr/bin/env node

const updateNotifier = require('update-notifier')
const pkg = require('../../package.json')

updateNotifier({ pkg }).notify()

require('yargs')
  .usage('Usage: $0 <cmd> [options]')
  .command(require('./cmd/run'))
  .command(require('./cmd/inspect'))
  .command(require('./cmd/view'))
  .option('c', {
    description: 'set config file',
    alias: 'config'
  })
  .help().argv
