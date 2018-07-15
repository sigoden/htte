const util = require('util');

const ClientError = function(message, parts = []) {
  Error.captureStackTrace(this);
  this.message = message;
  this.parts = parts;
};

util.inherits(ClientError, Error);
ClientError.prototype.name = 'ClientError';

module.exports = ClientError;
