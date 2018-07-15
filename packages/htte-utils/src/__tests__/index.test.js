const utils = require('../');
const path = require('path');

describe('type', function() {
  test('get value type', function() {
    expect(utils.type(true)).toBe('boolean');
    expect(utils.type(1.2)).toBe('number');
    expect(utils.type('abc')).toBe('string');
    expect(utils.type(null)).toBe('null');
    expect(utils.type(undefined)).toBe('undefined');
    expect(utils.type(function() {})).toBe('function');
    expect(utils.type([])).toBe('array');
    expect(utils.type({})).toBe('object');
  });
});

describe('trimYamlExt', function() {
  test('trim extension of yaml file', function() {
    expect(utils.trimYamlExt('name.yaml')).toBe('name');
    expect(utils.trimYamlExt('name.yml')).toBe('name');
    expect(utils.trimYamlExt('name.txt')).toBe('name.txt');
  });
});

describe('nameFromPath', function() {
  test('create variable name from path string', function() {
    expect(utils.nameFromPath('name')).toBe('name');
    expect(utils.nameFromPath('a/b/c')).toBe('abc');
    let ascii = '';
    for (let i = 0; i < 128; i++) {
      ascii += String.fromCodePoint(i);
    }
    expect(utils.nameFromPath(ascii)).toBe('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz');
  });
});

describe('md5x', function() {
  test('hash string with varidic length', function() {
    expect(utils.md5x('abc')).toBe('jaabfajidmnceplangjgdphnciobhphc');
    expect(utils.md5x('abc', 8)).toBe('jaabfaji');
    expect(utils.md5x('abc', 8)).toBe('jaabfaji');
    expect(utils.md5x('ab', 8)).toBe('bihopeed');
  });
});

describe('completeUrlParams', function() {
  test('complete url params', function() {
    expect(utils.completeUrlParams('/{a}/v2/{b}', { a: 'v1', b: 'v3' })).toBe('/v1/v2/v3');
    expect(utils.completeUrlParams('/a/b/c')).toBe('/a/b/c');
    expect(utils.completeUrlParams('/{a}/v2/{a}', { a: 'v1' })).toBe('/v1/v2/v1');
  });
  test('throw error when params do not match', function() {
    expect(() => {
      utils.completeUrlParams('/{a}/v2/{b}', { a: 'v1' });
    }).toThrow('params b is missed');
  });
});

describe('tryRequireExtension', function() {
  test('require module from special dir', function() {
    let localMod = utils.tryRequireExtension(path.resolve(__dirname, './fixtures'), 'path');
    expect(localMod.local).toBe(true);
    let npmMode = utils.tryRequireExtension(path.resolve('./fixtures'), 'path');
    expect(npmMode.local).toBeUndefined();
  })
  test('throw error when module can not be required', function() {
    expect(() => utils.tryRequireExtension(process.cwd, '404')).toThrow();
  });
})

describe('tmpfile', function() {
  test('generate tmpfile ', function() {
    let tmpfile = utils.tmpfile(path.resolve(__dirname, 'htte-utils'));
    expect(tmpfile).toMatch(/\/tmp\/htte-utils-\w{6}\.json/);
    let newtmpfile =  utils.tmpfile(path.resolve(__dirname, 'htte-utils'));
    expect(newtmpfile).toBe(tmpfile);
  })
})