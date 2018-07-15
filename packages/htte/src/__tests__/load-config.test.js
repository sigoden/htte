const loadConfig = require('../load-config');
const path = require('path');

describe('loadConfig', function() {
  test('should load config yaml file', function() {
    let configFile = path.resolve(__dirname, './fixtures/c1.yaml');
    let config = loadConfig(configFile);
    expect(config).toEqual({
      baseDir: path.dirname(configFile),
      modules: ['foo', 'bar']
    });
  });
  test('should apply patch', function() {
    let configFile = path.resolve(__dirname, './fixtures/c1.yaml');
    let config = loadConfig(configFile, 'patch');
    expect(config.modules).toEqual(['foo', 'bar', 'baz']);
  })
  test('throw validate error if config is invalid', function() {
    let configFile = path.resolve(__dirname, './fixtures/ce.yaml');
    expect(() => loadConfig(configFile)).toThrow(`validate config throw errors:
  .modules should be array`);
  })
  test('throw validate error if patch is invalid', function() {
    let configFile = path.resolve(__dirname, './fixtures/c1.yaml');
    expect(() => loadConfig(configFile, 'patcherr')).toThrow(`validate patch throw errors:
  [0].op should be equal to one of the allowed values
  [0].op should be equal to one of the allowed values
  [0].op should be equal to one of the allowed values
  [0] should match exactly one schema in oneOf`);
  })
});
