const util = require('util');

const ValidateError = function(type, errors) {
  Error.captureStackTrace(this);
  this.type = type;
  this.errors = errors;
  let errorsmsg = errors
    .map(function(err, index) {
      return `  ${err.dataPath} ${err.message}`;
    })
    .join('\n');
  this.message = `validate ${type} throw errors:\n${errorsmsg}`;
};

util.inherits(ValidateError, Error);
ValidateError.prototype.name = 'ValidateError';

module.exports = ValidateError;
