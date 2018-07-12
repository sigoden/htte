const util = require('util');

const ContextError = function(msg, parts = [], boundray) {
  Error.captureStackTrace(this, boundray);
  this.message = msg;
  this.parts = parts;
};

util.inherits(ContextError, Error);
ContextError.prototype.name = 'ContextError';

module.exports = ContextError;
