const ClientError = require('../ClientError');

test('constructor', function() {
  let parts = ['res', 'body'];
  let err = new ClientError('abc', parts);
  expect(err.message).toBe('abc');
  expect(err.parts).toBe(parts);
});
