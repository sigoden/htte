#!/usr/bin/env node

require('yargs')
  .usage('Usage: $0 <cmd> [options]')
  .command(require('../src/cmd/run'))
  .command(require('../src/cmd/inspect'))
  .command(require('../src/cmd/view'))
  .option('c', {
    description: 'set config file',
    alias: 'config',
    default: '.dectest.yaml'
  })
  .help().argv
