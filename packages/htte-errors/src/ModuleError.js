const util = require('util');

const ModuleError = function(msg, mod, parts = []) {
  Error.captureStackTrace(this);
  this.msg = msg;
  this.mod = mod;
  this.parts = parts;
  let joined = this.parts
    .map(function(v) {
      return `"${v}"`;
    })
    .join(' > ');
  this.message = `${this.msg} at ${this.mod} @ ${joined}`;
};

util.inherits(ModuleError, Error);
ModuleError.prototype.name = 'ModuleError';

module.exports = ModuleError;
