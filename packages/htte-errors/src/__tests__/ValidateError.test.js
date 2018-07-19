const ValidateError = require('../ValidateError');

test('constructor', function() {
  let errors = [
    {
      keyword: 'additionalProperties',
      dataPath: "[0].defines['auth1']",
      schemaPath: 'defines.json/patternProperties/.*/additionalProperties',
      params: { additionalProperty: 'test' },
      message: 'should NOT have additional properties'
    }
  ];
  let err = new ValidateError('config', errors);
  expect(err.message).toBe(`validate config throw errors:
  [0].defines['auth1'] should NOT have additional properties`);
  expect(err.type).toBe('config');
  expect(err.errors).toBe(errors);
});
