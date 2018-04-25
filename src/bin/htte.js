#!/usr/bin/env node

require('yargs')
  .usage('Usage: $0 <cmd> [options]')
  .command(require('./cmd/run'))
  .command(require('./cmd/inspect'))
  .command(require('./cmd/view'))
  .option('c', {
    description: 'set config file',
    alias: 'config',
    default: '.htte.yaml'
  })
  .help().argv
