const ContextError = require('../ContextError');

test('constructor', function() {
  let parts = ['res', 'body'];
  let err = new ContextError('abc', parts);
  expect(err.message).toBe('abc');
  expect(err.parts).toBe(parts);
});
