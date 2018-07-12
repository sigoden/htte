const util = require('util');

const ClientError = function(msg, parts = []) {
  Error.captureStackTrace(this);
  this.message = msg;
  this.parts = parts;
};

util.inherits(ClientError, Error);
ClientError.prototype.name = 'ClientError';

module.exports = ClientError;
