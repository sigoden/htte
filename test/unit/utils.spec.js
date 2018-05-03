const utils = require('../../src/utils')
const { resolveFixtureFile } = require('./helper')
const fs = require('fs')
const rimraf = require('rimraf')

describe('Test utils', () => {
  describe('loadYamlSync', () => {
    test('should load data object from yaml file', () => {
      expect(utils.loadYamlSync(resolveFixtureFile('./utils/model.yaml'))).toEqual({ a: 3, b: 4, c: ['g', 'h'] })
    })
    test('throw error if file is not found', () => {
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
    test('return false if directory path is a file', () => {
      expect(utils.directoryExistsSync(resolveFixtureFile('./utils/fakedir'))).toBe(false)
    })
    test('return false if directory does not exist', () => {
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
    test('have no effect  when file exists', () => {
      let file = resolveFixtureFile('./utils/exists')
      utils.ensureFileSync(file)
      expect(fs.existsSync(file)).toBe(true)
    })
    test('create file when file does not exist', () => {
      let file = resolveFixtureFile('./utils/notexists')
      utils.ensureFileSync(file)
      expect(fs.existsSync(file)).toBe(true)
      fs.unlinkSync(file)
    })
    test('create folder and file', () => {
      let file = resolveFixtureFile('./utils/folder/notexists')
      utils.ensureFileSync(file)
      expect(fs.existsSync(file)).toBe(true)
      rimraf.sync(resolveFixtureFile('./utils/folder'))
    })
  })
  describe('shortenFilePath', () => {
    test('should shorten file path', () => {
      expect(utils.shortenFilePath('/a/b', '/a/b/c/d')).toBe('c/d')
    })
    test('should remove the extension', () => {
      expect(utils.shortenFilePath('/a/b', '/a/b/c/d.yaml')).toBe('c/d')
    })
  })
  describe('collectUrlParams', () => {
    test('should collect url params', () => {
      expect(utils.collectUrlParams('/a/{b}/{c}')).toEqual(['b', 'c'])
    })
    test('should take care of duplicated params', () => {
      expect(utils.collectUrlParams('/a/{b}/c/{b}')).toEqual(['b'])
    })
  })
  describe('fillUrlParams', () => {
    test('should fill url params', () => {
      expect(utils.fillUrlParams('/a/{b}/{c}', { b: 'gogo', c: 3 })).toEqual('/a/gogo/3')
      expect(utils.fillUrlParams('/a/{b}/{b}', { b: 'gogo' })).toEqual('/a/gogo/gogo')
    })
  })
  describe('duplicateElements', () => {
    test('should remove duplicate elements', () => {
      expect(utils.duplicateElements(['a', 'b', 'c', 'c', 'a'])).toEqual(['a', 'c'])
    })
  })
  describe('isValidHttpUrl', () => {
    test('should check whether url is valid', () => {
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
  describe('randomString', () => {
    test('should generate 6-chars random string', () => {
      expect(utils.randomString()).toMatch(/^\w{6}$/)
      expect(utils.randomString() !== utils.randomString).toBe(true)
    })
    test('should generate n-chars with length param', () => {
      expect(utils.randomString(8)).toMatch(/^\w{8}$/)
    })
  })
  describe('type', () => {
    test('should return type of value', () => {
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
    test('should check whether value matchs type', () => {
      expect(utils.isTypeOf(3, 'number')).toBe(true)
      expect(utils.isTypeOf(3, ['number'])).toBe(true)
      expect(utils.isTypeOf(undefined, ['undefined', 'object'])).toBe(true)
      expect(utils.isTypeOf({}, ['undefined', 'object'])).toBe(true)
    })
  })
  describe('print', () => {
    let log$ = console.log
    afterAll(() => {
      console.log = log$
    })
    test('log error message when dubug is disabled', () => {
      let err = new Error('ops')
      console.log = jest.fn()
      utils.print(false)(err)
      expect(console.log).toHaveBeenCalledWith(err.message)
    })
    test('log error stack when dubug is enable', () => {
      let $ = console.log
      let err = new Error('ops')
      console.log = jest.fn()
      utils.print(true)(err)
      expect(console.log).toHaveBeenCalledWith(err)
    })
    test('should log normal data', () => {
      let $ = console.log
      let msg = 'abc'
      console.log = jest.fn()
      utils.print()(msg)
      expect(console.log).toHaveBeenCalledWith('abc')
    })
  })
})
