const utils = require('../');

describe('type', function() {
  test('get value type', function() {
    expect(utils.type(true)).toBe('boolean');
    expect(utils.type(1.2)).toBe('number');
    expect(utils.type(null)).toBe('null');
    expect(utils.type(undefined)).toBe('undefined');
    expect(utils.type(function() {})).toBe('function');
    expect(utils.type([])).toBe('array');
    expect(utils.type({})).toBe('object');
  });
});

describe('trimYamlExt', function() {});
