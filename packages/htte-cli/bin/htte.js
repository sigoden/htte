#!/usr/bin/env node
const htte = require('htte');
const program = require('commander');

program
  .command('run <config-file>')
  .description('path to a HTTE project config file.')
  .usage('<config-file> [options]')
  .option('--bail', 'Specify whether or not to gracefully stop a htte run on encountering an error')
  .option('--continue', 'Specify whether or not to continue run from abort unit')
  .option('--patch', 'Specify a patch config file to override the options in default config file')
  .option('-x , --suppress-exit-code', 'Specify whether or not to override the default exit code for the current run.')
  .option('--silent', 'Prevents newman from showing output to CLI.')
  .option('--disable-unicode', 'Forces unicode compliant symbols to be replaced by their plain text equivalents')
  .option('--no-color', 'Disable colored output.')
  .parse(process.argv);

const app = htte.init(program);

app.run(program);
