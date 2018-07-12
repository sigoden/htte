const util = require('util');

const ContextError = function(msg, segs = [], boundray) {
  Error.captureStackTrace(this, boundray);
  this.message = msg;
  this.segs = segs;
};

util.inherits(ContextError, Error);
ContextError.prototype.name = 'ContextError';

module.exports = ContextError;
