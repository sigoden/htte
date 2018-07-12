const util = require('util');

const ContextError = function(msg, segs = []) {
  Error.captureStackTrace(this);
  this.message = msg;
  this.segs = segs;
};

util.inherits(ContextError, Error);
ContextError.prototype.name = 'ContextError';

module.exports = ContextError;
