const Logger = require('../../src/logger')

describe('Test Logger', () => {
  test('private property', () => {
    let logger = new Logger()
    expect(logger._title).toBe('-')
    expect(logger._opts).toEqual({
      follow: false,
      indent: '  ',
      logFunc: console.log
    })
    expect(logger._msgs).toEqual([])
    expect(logger._level).toEqual(0)
    expect(logger._children).toEqual([])
    expect(logger._index).toEqual(-1)
    expect(logger._focus).toEqual(-1)
  })
  test('custom options', () => {
    let options = { indent: '\t' }
    let logger = new Logger('test', options)
    expect(logger._title).toBe('test')
    expect(logger._opts.indent).toBe(options.indent)
    expect(logger._opts.follow).toBe(false)
  })
})

describe('public function', () => {
  describe('setTitle', () => {
    test('should work', () => {
      let logger = new Logger('test')
      expect(logger.setTitle('retitle')).toBe(logger)
      expect(logger._title).toBe('retitle')
    })
  })
  describe('enter', () => {
    test('should work', () => {
      let logger = new Logger('a')
      let subLogger = logger.enter('b')
      expect(subLogger._opts).toEqual(logger._opts)
      expect(subLogger).toBeInstanceOf(Logger)
      expect(subLogger._parent).toBe(logger)
      expect(logger._children[0]).toBe(subLogger)
    })
    test('return child logger if find', () => {
      let logger = new Logger('a')
      let subLogger = logger.enter('b')
      let subLogger2 = logger.enter('b')
      expect(subLogger).toBe(subLogger2)
    })
  })
  describe('enters', () => {
    test('should work', () => {
      let logger = new Logger('a').enter('b').enter('c')
      let logger2 = new Logger('a').enters(['b', 'c'])
      expect(logger).toEqual(logger2)
    })
  })
  describe('exit', () => {
    test('should work', () => {
      let parent = new Logger('a')
      let child = parent.enter('b')
      expect(child.exit()).toBe(parent)
    })
    test('return root logger if exit in root logger', () => {
      let root = new Logger('a')
      expect(root.exit()).toBe(root)
    })
  })
  describe('findChild', () => {
    test('should work', () => {
      let parent = new Logger('a')
      let child = parent.enter('b')
      expect(parent.findChild('b')).toBe(child)
    })
    test('return undefined if not find', () => {
      let parent = new Logger('a')
      parent.enter('b')
      expect(parent.findChild('bb')).toBeUndefined()
    })
  })
  describe('dirty', () => {
    test('should be false when logger have msg', () => {
      let logger = new Logger('a')
      expect(logger.dirty()).toBe(false)
      logger.log('msg')
      expect(logger.dirty()).toBe(true)
    })
    test('should be false when any descendant logger have msg', () => {
      let root = new Logger('a')
      let level1 = root.enter('b')
      let level2 = level1.enter('c')
      let level3 = level2.enter('d')
      expect(root.dirty()).toBe(false)
      expect(level1.dirty()).toBe(false)
      expect(level2.dirty()).toBe(false)
      expect(level3.dirty()).toBe(false)
      level2.log('msg')
      expect(root.dirty()).toBe(true)
      expect(level1.dirty()).toBe(true)
      expect(level2.dirty()).toBe(true)
      expect(level3.dirty()).toBe(false)
    })
  })
  describe('toString', () => {
    test('should work', () => {
      let root = new Logger('root')
      root.log('a')
      let levelA = root.enter('1-a')
      levelA.log('b')
      let levelB = root.enter('1-b')
      let levelBA = levelB.enter('1-b-a')
      levelBA.log('c')
      let levelBAB = levelBA.enter('1-b-a-b')
      expect(root.toString()).toBe(`root:
  a
  1-a:
    b
  1-b:
    1-b-a:
      c
`)
    })
    test('return empty string if logger is not dirty', () => {
      let root = new Logger('root')
      expect(root.toString()).toBe('')
      root.enters(['a', 'b', 'c'])
      expect(root.toString()).toBe('')
    })
    test('should work when title is empty string', () => {
      let root = new Logger()
      root.enter('a').log('msg1')
      root.enter('b').log('msg2')
      expect(root.toString()).toBe(`-:
  a:
    msg1
  b:
    msg2
`)
    })
    test('options indent should affect the result', () => {
      let root = new Logger('root', { indent: '**' })
      root.log('a')
      let levelA = root.enter('1-a')
      levelA.log('b')
      let levelB = root.enter('1-b')
      let levelBA = levelB.enter('1-b-a')
      levelBA.log('c')
      let levelBAB = levelBA.enter('1-b-a-b')
      expect(root.toString()).toBe(`root:
**a
**1-a:
****b
**1-b:
****1-b-a:
******c
`)
    })
  })
  describe('tryThrow', () => {
    test('should throw error if logger is dirty', () => {
      let logger = new Logger('logger')
      logger.log('msg')
      expect(() => logger.tryThrow()).toThrow(logger.toString())
    })
    test('should not throw if logger is not dirty', () => {
      let logger = new Logger('logger')
      expect(() => logger.tryThrow()).not.toThrow()
    })
  })
  describe('log', () => {
    test('should work', () => {
      let logger = new Logger('logger')
      expect(logger.log('msg')).toBeUndefined()
    })
    test('should work when follow is enabled', () => {
      let logFn = jest.fn()
      let logger = new Logger('logger', { follow: true, logFunc: logFn })
      logger.log('msg')
      expect(logFn.mock.calls).toEqual([['logger:'], ['  msg']])
      logger.log('msg2')
      expect(logFn.mock.calls).toEqual([['logger:'], ['  msg'], ['  msg2']])
    })
    test('should take care of title reusing', () => {
      let logFn = jest.fn()
      let logger = new Logger('logger', { follow: true, logFunc: logFn })
      let logger1 = logger.enters(['a', 'b', 'c'])
      debugger
      logger1.log('msg')
      let logger2 = logger.enters(['a', 'd', 'b'])
      logger2.log('msg2')
      logger1.log('msg3')
      expect(logFn.mock.calls.join('\n')).toBe(`logger:
  a:
    b:
      c:
        msg
    d:
      b:
        msg2
    b:
      c:
        msg3`
      )
    })
  })
})
