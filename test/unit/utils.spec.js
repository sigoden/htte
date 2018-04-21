const utils = require('../../src/utils')
const { resolveFixtureFile } = require('./helper')
const fs = require('fs')
const rimraf = require('rimraf')

describe('Test utils', () => {
  describe('loadYamlSync', () => {
    test('should work', () => {
      expect(utils.loadYamlSync(resolveFixtureFile('./utils/model.yaml'))).toEqual({ a: 3, b: 4, c: ['g', 'h'] })
    })
    test('throw error if file not find', () => {
      expect(() => utils.loadYamlSync(resolveFixtureFile('./utils/notfind.yaml'))).toThrow()
    })
    test('throw error if file is not valid yaml', () => {
      expect(() => utils.loadYamlSync(resolveFixtureFile('./utils/error.yaml'))).toThrow()
    })
  })
  describe('directoryExistsSync', () => {
    test('return true if directory exists', () => {
      expect(utils.directoryExistsSync(resolveFixtureFile('./utils/dir'))).toBe(true)
    })
    test('return false if path is file', () => {
      expect(utils.directoryExistsSync(resolveFixtureFile('./utils/fakedir'))).toBe(false)
    })
    test('return false if not exist directory', () => {
      expect(utils.directoryExistsSync(resolveFixtureFile('./utils/nodir'))).toBe(false)
    })
  })
  describe('sortFiles', () => {
    test('sort file based on path', () => {
      expect(
        utils.sortFiles([
          'a/world',
          'a/lib/index.js',
          'b/package.json',
          'b/lib/3/index.js',
          'b/lib/2/README.js',
          'a/hello',
          'b/lib/2/index.js',
          'a/lib/README.md',
          'b/lib/3/README.js',
          'c'
        ])
      ).toEqual([
        'a/hello',
        'a/world',
        'a/lib/index.js',
        'a/lib/README.md',
        'b/package.json',
        'b/lib/2/index.js',
        'b/lib/2/README.js',
        'b/lib/3/index.js',
        'b/lib/3/README.js',
        'c'
      ])
    })
  })
  describe('ensureFileSync', () => {
    test('should work when file exists', () => {
      let file = resolveFixtureFile('./utils/exists')
      utils.ensureFileSync(file)
      expect(fs.existsSync(file)).toBe(true)
    })
    test('create file when file do not exist', () => {
      let file = resolveFixtureFile('./utils/notexists')
      utils.ensureFileSync(file)
      expect(fs.existsSync(file)).toBe(true)
      fs.unlinkSync(file)
    })
    test('create folder and file when file do not exist', () => {
      let file = resolveFixtureFile('./utils/folder/notexists')
      utils.ensureFileSync(file)
      expect(fs.existsSync(file)).toBe(true)
      rimraf.sync(resolveFixtureFile('./utils/folder'))
    })
  })
  describe('shortenFilePath', () => {
    test('should work', () => {
      expect(utils.shortenFilePath('/a/b', '/a/b/c/d')).toBe('c/d')
    })
    test('omit the ext', () => {
      expect(utils.shortenFilePath('/a/b', '/a/b/c/d.yaml')).toBe('c/d')
    })
  })
  describe('collectUrlParams', () => {
    test('should work', () => {
      expect(utils.collectUrlParams('/a/{b}/{c}')).toEqual(['b', 'c'])
    })
    test('omit the duplicated key', () => {
      expect(utils.collectUrlParams('/a/{b}/c/{b}')).toEqual(['b'])
    })
  })
  describe('fillUrlParams', () => {
    test('should work', () => {
      expect(utils.fillUrlParams('/a/{b}/{c}', { b: 'gogo', c: 3 })).toEqual('/a/gogo/3')
      expect(utils.fillUrlParams('/a/{b}/{b}', { b: 'gogo' })).toEqual('/a/gogo/gogo')
    })
  })
  describe('duplicateElements', () => {
    test('should work', () => {
      expect(utils.duplicateElements(['a', 'b', 'c', 'c', 'a'])).toEqual(['a', 'c'])
    })
  })
  describe('isValidHttpUrl', () => {
    test('should work', () => {
      expect(utils.isValidHttpUrl('http://localhost')).toBe(true)
      expect(utils.isValidHttpUrl('http://localhost:3000')).toBe(true)
      expect(utils.isValidHttpUrl('http://localhost:3000/api')).toBe(true)
      expect(utils.isValidHttpUrl('http://localhost/api')).toBe(true)
      expect(utils.isValidHttpUrl('http://localhost/api/')).toBe(true)
      expect(utils.isValidHttpUrl('http://localhost/api/user')).toBe(true)
      expect(utils.isValidHttpUrl('https://localhost')).toBe(true)

      expect(utils.isValidHttpUrl('localhost')).toBe(false)
      expect(utils.isValidHttpUrl('mongo://localhost:27017')).toBe(false)
      expect(utils.isValidHttpUrl('http://localhost?a')).toBe(false)
      expect(utils.isValidHttpUrl('http://localhost#a')).toBe(false)
      expect(utils.isValidHttpUrl('localhost/api')).toBe(false)
    })
  })
  describe('type', () => {
    test('should work', () => {
      expect(utils.type(3)).toBe('number')
      expect(utils.type(true)).toBe('boolean')
      expect(utils.type('a')).toBe('string')
      expect(utils.type(null)).toBe('null')
      expect(utils.type(undefined)).toBe('undefined')
      expect(utils.type([])).toBe('array')
      expect(utils.type(() => {})).toBe('function')
    })
  })
  describe('isTypeOf', () => {
    test('should work', () => {
      expect(utils.isTypeOf(3, 'number')).toBe(true)
      expect(utils.isTypeOf(3, ['number'])).toBe(true)
      expect(utils.isTypeOf(undefined, ['undefined', 'object'])).toBe(true)
      expect(utils.isTypeOf({}, ['undefined', 'object'])).toBe(true)
    })
  })
})
