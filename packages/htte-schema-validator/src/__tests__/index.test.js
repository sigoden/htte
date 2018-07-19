const validator = require('../');

describe('validator', function() {
  test('validateConfig', function() {
    let valid = validator.config(require('./fixtures/config.json'));
    expect(valid).toBe(true);
  });
  test('validatePatch', function() {
    let valid = validator.patch(require('./fixtures/patch.json'));
    expect(valid).toBe(true);
  });
  test('validateModule', function() {
    let valid = validator.module(require('./fixtures/module.json'));
    expect(valid).toBe(true);
  });
});
