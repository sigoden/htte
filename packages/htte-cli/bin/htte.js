#!/usr/bin/env node
const htte = require('htte');
const program = require('commander');

program
  .command('run <config-file>')
  .usage('<config-file> [options]')
  .option('--bail', 'Specify whether or not to gracefully stop a htte run on encountering an error')
  .option('--continue', 'Specify whether or not to continue run from abort unit')
  .option('--patch', 'Specify a patch config file to override the options in default config file')
  .option('-x , --suppress-exit-code', 'Specify whether or not to override the default exit code for the current run.')
  .option('--silent', 'Prevents newman from showing output to CLI.')
  .option('--disable-unicode', 'Forces unicode compliant symbols to be replaced by their plain text equivalents')
  .option('--no-color', 'Disable colored output.')
  .action(function(configFile, cmd) {
    const app = htte.init({
      configFile,
      patch: cmd.patch
    });
    app.run(cmd);
  });

process.on('unhandledRejection', function(err) {
  console.log(err);
});

program.parse(process.argv);
