const ModuleError = require('../ModuleError');

test('constructor', function() {
  let parts = ['t1', 't2'];
  let err = new ModuleError('abc', 'm1', parts);
  expect(err.msg).toBe('abc');
  expect(err.mod).toBe('m1');
  expect(err.parts).toBe(parts);
  expect(err.message).toBe('abc at m1 @ \"t1\" > \"t2\"');
})