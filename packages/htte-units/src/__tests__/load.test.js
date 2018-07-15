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
  test('load subdir module', function() {
    let config = {
      baseDir: path.resolve(__dirname, './fixtures'),
      modules: ['subdir/m1']
    };
    let modules = load(config, shcmea);
    expect(modules.subdirm1).toEqual([{ client: 'http', describe: 'test1', req: { url: '/login' } }]);
  });
  test('load failed', function() {
    let config = {
      baseDir: path.resolve(__dirname, './fixtures'),
      modules: ['m404']
    };
    expect(() => load(config, shcmea)).toThrow('cannot load modules at m404, cannot find yaml file');
  });
  test('validate failed', function() {
    let config = {
      baseDir: path.resolve(__dirname, './fixtures'),
      modules: ['minvalid']
    };
    expect(() => load(config, shcmea)).toThrow(`validate modules minvalid throw errors:
  [0].req should be object`);
  });
});
