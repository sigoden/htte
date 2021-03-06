const load = require('../load');
const path = require('path');
const createSchema = require('../schema');

const shcmea = createSchema({});

describe('load', function() {
  test('load module', function() {
    let config = {
      baseDir: path.resolve(__dirname, './fixtures'),
      modules: ['m1', 'm2.yaml', 'm3.yml']
    };
    let modules = load(config, shcmea);
    expect(modules.m1).toEqual([{ client: 'http', describe: 'test1', req: { url: '/login' } }]);
    expect(modules.m2).toBeDefined();
    expect(modules.m2).toBeDefined();
  });
  test('load subdir module only', function() {
    let config = {
      baseDir: path.resolve(__dirname, './fixtures'),
      modules: ['subdir/m1']
    };
    let modules = load(config, shcmea);
    expect(modules.m1).toEqual([{ client: 'http', describe: 'test1', req: { url: '/login' } }]);
  });
  test('load with subdir module', function() {
    let config = {
      baseDir: path.resolve(__dirname, './fixtures'),
      modules: ['m1', 'subdir/m1']
    };
    let modules = load(config, shcmea);
    expect(Object.keys(modules)).toEqual(['m1', 'subdir_m1']);
  });
  test('load failed', function() {
    let config = {
      baseDir: path.resolve(__dirname, './fixtures'),
      modules: ['m404']
    };
    expect(() => load(config, shcmea)).toThrow('cannot load module m404 because of cannot find yaml file');
  });
  test('validate failed', function() {
    let config = {
      baseDir: path.resolve(__dirname, './fixtures'),
      modules: ['invalid']
    };
    expect(() => load(config, shcmea)).toThrow(`validate modules invalid throw errors:
  [0].req should be object`);
  });
});
