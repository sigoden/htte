#!/usr/bin/env node
const htte = require('htte');
const program = require('commander');

program
  .usage('<config-file> [options]')
  .option('--bail', 'Specify whether or not to gracefully stop a htte run on encountering an error')
  .option('--continue', 'Specify whether or not to continue run from abort unit')
  .option('--patch', 'Specify a patch config file to override the options in default config file')
  .option('--silent', 'Prevents newman from showing output to CLI.')
  .option('--disable-unicode', 'Forces unicode compliant symbols to be replaced by their plain text equivalents')
  .parse(process.argv);

let app;
try {
  app = htte.init({
    configFile: program.args[0],
    patch: program.patch
  });
} catch (err) {
  console.log();
  console.log(`\u001b[31m${err.name}: ${err.message}\u001b[0m`);
  console.log();
  process.exit(1);
}

app.run(program);
