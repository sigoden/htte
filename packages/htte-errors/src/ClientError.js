const util = require('util');

const ClientError = function(msg, segs = []) {
  Error.captureStackTrace(this);
  this.message = msg;
  this.segs = segs;
};

util.inherits(ClientError, Error);
ClientError.prototype.name = 'ClientError';

module.exports = ClientError;
