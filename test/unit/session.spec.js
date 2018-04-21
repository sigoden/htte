const { resolveFixtureFile } = require('./helper')
const Session = require('../../src/session')
const fs = require('fs')

describe('Test Session', () => {
  test('private property', () => {
    let sessionFile = resolveFixtureFile('./session/file')
    let session = new Session(sessionFile)
    expect(session._file).toBe(sessionFile)
    expect(session._records).toEqual({})
    expect(session._cursor).toEqual(0)
  })
})

describe('public function', () => {
  describe('writeUnit', () => {
    test('should work', () => {
      let session = new Session(resolveFixtureFile('./session/file'))
      let unit = { module: () => 'module', name: () => 'unit' }
      let key = 'req'
      let value = { body: { msg: 'ok' } }
      session.writeUnit(unit, key, value)
      expect(session._records['module']['unit']['req']).toEqual(value)
    })
    test('should override', () => {
      let session = new Session(resolveFixtureFile('./session/file'))
      let unit = { module: () => 'module', name: () => 'unit' }
      let key = 'req'
      let value = { body: { msg: 'ok' } }
      let value1 = 'ok'
      session.writeUnit(unit, key, value)
      session.writeUnit(unit, key, value1)
      expect(session._records['module']['unit']['req']).toEqual(value1)
    })
  })
  describe('readUnit', () => {
    test('should work', () => {
      let session = new Session(resolveFixtureFile('./session/file'))
      let unit = { module: () => 'module', name: () => 'unit' }
      let key = 'req'
      let value = { body: { msg: 'ok' } }
      session.writeUnit(unit, key, value)
      let result = session.readUnit(unit, key)
      expect(result).toEqual(value)
      let result2 = session.readUnit(unit)
      expect(result2).toEqual({ req: value })
    })
    test('return undefined if not find', () => {
      let session = new Session(resolveFixtureFile('./session/file'))
      let unit = { module: () => 'module', name: () => 'unit' }
      expect(session.readUnit(unit, 'req')).toBeUndefined()
    })
  })
  describe('records', () => {
    test('return _records', () => {
      let session = new Session(resolveFixtureFile('./session/file'))
      let value = { module: { unit: { req: { body: { msg: 'ok' } } } } }
      session._records = value
      expect(session.records()).toBe(value)
    })
    test('default value is {}', () => {
      let session = new Session(resolveFixtureFile('./session/file'))
      expect(session.records()).toEqual({})
    })
  })
  describe('cursor', () => {
    test('return _records', () => {
      let session = new Session(resolveFixtureFile('./session/file'))
      session._cursor = 32
      expect(session.cursor()).toBe(32)
    })
    test('default value is 0', () => {
      let session = new Session(resolveFixtureFile('./session/file'))
      expect(session.cursor()).toBe(0)
    })
  })
  describe('setCursor', () => {
    test('should work', () => {
      let session = new Session(resolveFixtureFile('./session/file'))
      session.setCursor(32)
      expect(session.cursor()).toBe(32)
    })
    test('take no effect if value is not integer', () => {
      let session = new Session(resolveFixtureFile('./session/file'))
      session.setCursor('32')
      expect(session.cursor()).toBe(0)
    })
  })
  describe('setRecords', () => {
    test('should work', () => {
      let session = new Session(resolveFixtureFile('./session/file'))
      let value = { module: { unit: { req: { body: { msg: 'ok' } } } } }
      session.setRecords(value)
      expect(session.records()).toBe(value)
    })
    test('take no effect if value is not object', () => {
      let session = new Session(resolveFixtureFile('./session/file'))
      let value = [{ module: { unit: { req: { body: { msg: 'ok' } } } } }]
      session.setRecords(value)
      expect(session.records()).toEqual({})
    })
  })
  describe('persist', () => {
    test('should work', () => {
      let file = resolveFixtureFile('./session/file')
      let session = new Session(file)
      let value = { module: { unit: { req: { body: { msg: 'ok' } } } } }
      session.setRecords(value)
      session.setCursor(32)
      session.persist()
      let content = fs.readFileSync(file, 'utf8')
      expect(JSON.parse(content)).toEqual({ cursor: 32, records: value })
    })
  })
  describe('restore', () => {
    test('should work', () => {
      let file = resolveFixtureFile('./session/file')
      let session = new Session(file)
      session.restore()
      expect(session.cursor()).toBe(32)
      expect(session.records()).toEqual({ module: { unit: { req: { body: { msg: 'ok' } } } } })
    })
    test('take no effect when session file have bad content', () => {
      let file = resolveFixtureFile('./session/file')
      let session = new Session(file)
      fs.writeFileSync(file, '')
      session.restore()
      expect(session.cursor()).toBe(0)
      expect(session.records()).toEqual({})
    })
  })
})
