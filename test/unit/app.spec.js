const App = require('../../src/app')
const Config = require('../../src/config')
const UnitManager = require('../../src/unit-manager')
const Session = require('../../src/session')
const Logger = require('../../src/logger')
const { resolveFixtureFile } = require('./helper')

jest.mock('../../src/unit-manager', () => {
  return jest.fn().mockImplementation(() => ({
    units: jest.fn().mockImplementation(() => [])
  }))
})

beforeEach(() => {
  UnitManager.mockClear()
  UnitManager.mockImplementation(() => ({
    units: jest.fn(() => [])
  }))
})

describe('Test App', () => {
  describe('constructor', () => {
    test('private property', () => {
      let app = new App(resolveFixtureFile('./app/config.yaml'))
      expect(app._ready).toBe(true)
      expect(app._print).toBe(console.log)
      expect(app._config).toBeInstanceOf(Config)
      expect(app._units).toEqual([])
      expect(UnitManager).toHaveBeenCalledTimes(1)
      expect(app._session)
    })
    test('print error if config or unit-manager throw error', () => {
      UnitManager.mockImplementation(() => {
        throw new Error('unit-manager throw error')
      })
      let print = jest.fn()
      let app = new App(resolveFixtureFile('./app/config.yaml'), print)
      expect(app._ready).toBe(false)
      expect(print.mock.calls[0][0]).toBeInstanceOf(Error)
    })
  })
  describe('run', () => {
    test('break if not ready', () => {
      UnitManager.mockImplementation(() => {
        throw new Error('unit-manager throw error')
      })
      let app = new App(resolveFixtureFile('./app/config.yaml'), jest.fn())
      app._unitCursor = jest.fn(() => {
        throw new Error('_unitCursor throw error')
      })
      return app.run({}).then(result => expect(result).toBeUndefined())
    })
    test('reject when cannot get the units', () => {
      let app = new App(resolveFixtureFile('./app/config.yaml'), jest.fn())
      app._unitCursor = jest.fn(() => {
        throw new Error('_unitCursor throw error')
      })
      return app.run({}).catch(err => {
        expect(err).toBeInstanceOf(Error)
        expect(err.message).toMatch('_unitCursor throw error')
      })
    })
    test('break when fail the unit and the bail option is enabled', () => {
      UnitManager.mockImplementation(() => ({
        units: jest.fn(() => [
          createMockUnit({ name: 'unit1', describes: ['unit1'] }),
          createMockUnit({ name: 'unit2', describes: ['unit2'], execute: { pass: false, res: {} } }),
          createMockUnit({ name: 'unit3', describes: ['unit3'] })
        ])
      }))
      let app = new App(resolveFixtureFile('./app/config.yaml'), jest.fn())
      return app.run({ bail: true }).then(result => {
        expect(app._units[1].execute).toHaveBeenCalled()
        expect(app._units[2].execute).not.toHaveBeenCalled()
        expect(result).toBe(1)
      })
    })
    test('continue run when fail the unit but the bail option is disabled', () => {
      UnitManager.mockImplementation(() => ({
        units: jest.fn(() => [
          createMockUnit({ name: 'unit1', describes: ['unit1'] }),
          createMockUnit({ name: 'unit2', describes: ['unit2'], execute: { pass: false, res: {} } }),
          createMockUnit({ name: 'unit3', describes: ['unit3'] })
        ])
      }))
      let app = new App(resolveFixtureFile('./app/config.yaml'), jest.fn())
      return app.run({}).then(() => {
        expect(app._units[2].execute).toHaveBeenCalled()
      })
    })
    test('run one unit when the shot option is enabled', () => {
      UnitManager.mockImplementation(() => ({
        units: jest.fn(() => [
          createMockUnit({ name: 'unit1', describes: ['unit1'] }),
          createMockUnit({ name: 'unit2', describes: ['unit2'] }),
          createMockUnit({ name: 'unit3', describes: ['unit3'] })
        ])
      }))
      let app = new App(resolveFixtureFile('./app/config.yaml'), jest.fn())
      app._session.cursor = jest.fn().mockReturnValue(1)
      return app.run({ shot: true, amend: true }).then(() => {
        expect(app._units[0].execute).not.toHaveBeenCalled()
        expect(app._units[1].execute).toHaveBeenCalled()
        expect(app._units[2].execute).not.toHaveBeenCalled()
      })
    })
    test('call persist and setCursor', () => {
      UnitManager.mockImplementation(() => ({
        units: jest.fn(() => [
          createMockUnit({ name: 'unit1', describes: ['unit1'] }),
          createMockUnit({ name: 'unit2', describes: ['unit2'], execute: { pass: false, res: {} } }),
          createMockUnit({ name: 'unit3', describes: ['unit3'] })
        ])
      }))
      let app = new App(resolveFixtureFile('./app/config.yaml'), jest.fn())
      app._session.persist = jest.fn()
      app._session.setCursor = jest.fn()
      return app.run({}).then(() => {
        expect(app._session.setCursor).toHaveBeenCalledTimes(3)
        expect(app._session.persist).toHaveBeenCalledTimes(1)
      })
    })
  })
  describe('view', () => {
    test('break if not ready', () => {
      UnitManager.mockImplementation(() => {
        throw new Error('unit-manager throw error')
      })
      let app = new App(resolveFixtureFile('./app/config.yaml'), jest.fn())
      app._print = jest.fn(() => {
        throw new Error('_print throw error')
      })
      expect(() => app.view()).not.toThrow()
    })
    test('should work', () => {
      UnitManager.mockImplementation(() => ({
        units: jest.fn(() => [
          createMockUnit({ name: 'unit1', describes: ['unit1'] }),
          createMockUnit({ name: 'unit2', describes: ['unit2'] }),
          createMockUnit({ name: 'unit3', describes: ['unit3'] })
        ])
      }))
      let app = new App(resolveFixtureFile('./app/config.yaml'), jest.fn())
      app.view({})
      expect(app._print).toHaveBeenCalledTimes(1)
      app._units.map(u => expect(u.view).toHaveBeenCalledTimes(1))
    })
    test('filter the module', () => {
      UnitManager.mockImplementation(() => ({
        units: jest.fn(() => [
          createMockUnit({ name: 'unit1', module: 'module1', describes: ['unit1'] }),
          createMockUnit({ name: 'unit2', module: 'module2', describes: ['unit2'] }),
          createMockUnit({ name: 'unit3', module: 'module3', describes: ['unit3'] })
        ])
      }))
      let app = new App(resolveFixtureFile('./app/config.yaml'), jest.fn())
      app.view({ module: 'module2' })
      expect(app._units[0].view).not.toHaveBeenCalled()
      expect(app._units[1].view).toHaveBeenCalled()
      expect(app._units[2].view).not.toHaveBeenCalled()
    })
    test('filter the module with array', () => {
      UnitManager.mockImplementation(() => ({
        units: jest.fn(() => [
          createMockUnit({ name: 'unit1', module: 'module1', describes: ['unit1'] }),
          createMockUnit({ name: 'unit2', module: 'module2', describes: ['unit2'] }),
          createMockUnit({ name: 'unit3', module: 'module3', describes: ['unit3'] })
        ])
      }))
      let app = new App(resolveFixtureFile('./app/config.yaml'), jest.fn())
      app.view({ module: ['module2', 'module3'] })
      expect(app._units[0].view).not.toHaveBeenCalled()
      expect(app._units[1].view).toHaveBeenCalled()
      expect(app._units[2].view).toHaveBeenCalled()
    })
    test('filter the api', () => {
      UnitManager.mockImplementation(() => ({
        units: jest.fn(() => [
          createMockUnit({ name: 'unit1', api: 'getModel1', describes: ['unit1'] }),
          createMockUnit({ name: 'unit2', api: 'getModel2', describes: ['unit2'] }),
          createMockUnit({ name: 'unit3', api: 'getModel3', describes: ['unit3'] })
        ])
      }))
      let app = new App(resolveFixtureFile('./app/config.yaml'), jest.fn())
      app.view({ api: 'getModel2' })
      expect(app._units[0].view).not.toHaveBeenCalled()
      expect(app._units[1].view).toHaveBeenCalled()
      expect(app._units[2].view).not.toHaveBeenCalled()
    })
    test('filter the api with array', () => {
      UnitManager.mockImplementation(() => ({
        units: jest.fn(() => [
          createMockUnit({ name: 'unit1', api: 'getModel1', describes: ['unit1'] }),
          createMockUnit({ name: 'unit2', api: 'getModel2', describes: ['unit2'] }),
          createMockUnit({ name: 'unit3', api: 'getModel3', describes: ['unit3'] })
        ])
      }))
      let app = new App(resolveFixtureFile('./app/config.yaml'), jest.fn())
      app.view({ api: ['getModel2', 'getModel3'] })
      expect(app._units[0].view).not.toHaveBeenCalled()
      expect(app._units[1].view).toHaveBeenCalled()
      expect(app._units[2].view).toHaveBeenCalled()
    })
  })
  describe('inspect', () => {
    test('break if not ready', () => {
      UnitManager.mockImplementation(() => {
        throw new Error('unit-manager throw error')
      })
      let app = new App(resolveFixtureFile('./app/config.yaml'), jest.fn())
      app._unitCursor = jest.fn(() => {
        throw new Error('_unitCursor throw error')
      })
      expect(() => app.inspect()).not.toThrow()
    })
    test('should work', () => {
      UnitManager.mockImplementation(() => ({
        units: jest.fn(() => [
          createMockUnit({ name: 'unit1', describes: ['unit1'] }),
          createMockUnit({ name: 'unit2', describes: ['unit2'] }),
          createMockUnit({ name: 'unit3', describes: ['unit3'] })
        ])
      }))
      let app = new App(resolveFixtureFile('./app/config.yaml'), jest.fn())
      let data = {}
      app._session.readUnit = jest.fn().mockReturnValue(data)
      app.inspect({ unit: 'module-unit2' })
      expect(app._units[1].inspect).toHaveBeenCalledWith(data)
      expect(app._print).toHaveBeenCalled()
    })
    test('should work when not specify the unit', () => {
      UnitManager.mockImplementation(() => ({
        units: jest.fn(() => [
          createMockUnit({ name: 'unit1', describes: ['unit1'] }),
          createMockUnit({ name: 'unit2', describes: ['unit2'] }),
          createMockUnit({ name: 'unit3', describes: ['unit3'] })
        ])
      }))
      let app = new App(resolveFixtureFile('./app/config.yaml'), jest.fn())
      let data = {}
      app._session.cursor = jest.fn().mockReturnValue(1)
      app._session.readUnit = jest.fn().mockReturnValue(data)
      app.inspect({})
      expect(app._units[1].inspect).toHaveBeenCalledWith(data)
      expect(app._print).toHaveBeenCalled()
    })
    test('print error if not find', () => {
      let app = new App(resolveFixtureFile('./app/config.yaml'), jest.fn())
      app.inspect({})
      expect(app._print).toHaveBeenCalled()
    })
    test('should work if not find session', () => {
      UnitManager.mockImplementation(() => ({
        units: jest.fn(() => [
          createMockUnit({ name: 'unit1', describes: ['unit1'] }),
          createMockUnit({ name: 'unit2', describes: ['unit2'] }),
          createMockUnit({ name: 'unit3', describes: ['unit3'] })
        ])
      }))
      let app = new App(resolveFixtureFile('./app/config.yaml'), jest.fn())
      let data = {}
      app._session.cursor = jest.fn().mockReturnValue(1)
      app._session.readUnit = jest.fn().mockReturnValue(undefined)
      app.inspect({})
      expect(app._units[1].inspect).toHaveBeenCalledWith({})
    })
  })
  describe('_unitCursor', () => {
    test('should work', () => {
      UnitManager.mockImplementation(() => ({
        units: jest.fn(() => [
          createMockUnit({ name: 'unit1', describes: ['unit1'] }),
          createMockUnit({ name: 'unit2', describes: ['unit2'] }),
          createMockUnit({ name: 'unit3', describes: ['unit3'] })
        ])
      }))
      let app = new App(resolveFixtureFile('./app/config.yaml'), jest.fn())
      let cursor = app._unitCursor('module-unit2')
      expect(cursor).toBe(1)
    })
    test('throw error when units is empty', () => {
      UnitManager.mockImplementation(() => ({
        units: jest.fn(() => [])
      }))
      let app = new App(resolveFixtureFile('./app/config.yaml'), jest.fn())
      expect(() => app._unitCursor('module-unit2')).toThrow('cannot find unit')
    })
    test('throw error when unit not find', () => {
      UnitManager.mockImplementation(() => ({
        units: jest.fn(() => [
          createMockUnit({ name: 'unit1', describes: ['unit1'] }),
          createMockUnit({ name: 'unit2', describes: ['unit2'] }),
          createMockUnit({ name: 'unit3', describes: ['unit3'] })
        ])
      }))
      let app = new App(resolveFixtureFile('./app/config.yaml'), jest.fn())
      expect(() => app._unitCursor('unit2')).toThrow('cannot find unit')
    })
    test('should work using session cursor', () => {
      UnitManager.mockImplementation(() => ({
        units: jest.fn(() => [
          createMockUnit({ name: 'unit1', describes: ['unit1'] }),
          createMockUnit({ name: 'unit2', describes: ['unit2'] }),
          createMockUnit({ name: 'unit3', describes: ['unit3'] })
        ])
      }))
      let app = new App(resolveFixtureFile('./app/config.yaml'), jest.fn())
      app._session.cursor = jest.fn().mockReturnValue(1)
      expect(app._unitCursor(undefined, true)).toBe(1)
    })
    test('return 0 if session cursor out of boundray', () => {
      UnitManager.mockImplementation(() => ({
        units: jest.fn(() => [
          createMockUnit({ name: 'unit1', describes: ['unit1'] }),
          createMockUnit({ name: 'unit2', describes: ['unit2'] }),
          createMockUnit({ name: 'unit3', describes: ['unit3'] })
        ])
      }))
      let app = new App(resolveFixtureFile('./app/config.yaml'), jest.fn())
      app._session.cursor = jest.fn().mockReturnValue(3)
      expect(app._unitCursor(undefined, true)).toBe(0)
    })
  })
  describe('_runUnit', () => {
    function helper(unitOptions) {
      let app = new App(resolveFixtureFile('./app/config.yaml'), jest.fn())
      let unit = createMockUnit(unitOptions)
      let logger = new Logger()
      return { app, unit, logger }
    }
    test('break when isContinue is false', () => {
      let { app, unit, logger } = helper()
      return app._runUnit(false, unit, logger, {}).then(v => expect(v).toBe(false))
    })
    test('debug when the debug option is enabled', () => {
      let { app, unit, logger } = helper()
      return app._runUnit(true, unit, logger, { debug: true }).then(() => {
        expect(unit.debug).toHaveBeenCalled()
      })
    })
    test('debug when the bail option is enabled and fail the unit', () => {
      let { app, unit, logger } = helper({ execute: { pass: false, res: {} } })
      return app._runUnit(true, unit, logger, { bail: true }).then(() => {
        expect(unit.debug).toHaveBeenCalled()
      })
    })
    test('unit passed', () => {
      let { app, unit, logger } = helper()
      app._session.writeUnit = jest.fn()
      return app._runUnit(true, unit, logger, {}).then(result => {
        expect(app._session.writeUnit).toHaveBeenCalled()
        expect(logger.toString()).toMatch(/ok \[\d+ms\]/)
        expect(result).toBe(true)
      })
    })
    test('unit failed', () => {
      let { app, unit, logger } = helper({ execute: { pass: false, res: {} } })
      app._session.writeUnit = jest.fn()
      return app._runUnit(true, unit, logger, {}).then(result => {
        expect(app._session.writeUnit).toHaveBeenCalled()
        expect(logger.dirty()).toBe(false)
        expect(result).toBe(true)
      })
    })
    test('unit failed with err', () => {
      let { app, unit, logger } = helper({ execute: { pass: false, res: { err: 'something wrong' } } })
      return app._runUnit(true, unit, logger, {}).then(result => {
        expect(logger.toString()).toMatch('something wrong')
        expect(result).toBe(true)
      })
    })
    test('unit failed when the bail options is enabled', () => {
      let { app, unit, logger } = helper({ execute: { pass: false, res: {} } })
      return app._runUnit(true, unit, logger, { bail: true }).then(result => {
        expect(logger.dirty()).toBe(false)
        expect(result).toBe(false)
      })
    })
    test('execute rejected', () => {
      let { app, unit, logger } = helper({ executeError: new Error('unit execute throw error') })
      return app._runUnit(true, unit, logger, {}).then(result => {
        expect(app._print).toHaveBeenCalled()
        expect(result).toBe(false)
      })
    })
  })
})

function createMockUnit(options = {}) {
  let {
    describes = ['a unit'],
    module = 'module',
    name = 'unit',
    api = 'getModel',
    execute = {
      pass: true,
      res: {
        time: 30
      }
    },
    executeError
  } = options
  let unit = {
    debug: jest.fn(),
    module: jest.fn().mockImplementation(() => module),
    describes: jest.fn().mockImplementation(() => describes),
    dependencies: jest.fn().mockImplementation(() => []),
    name: jest.fn().mockImplementation(() => name),
    id: jest.fn().mockImplementation(() => module + '-' + name),
    api: jest.fn().mockImplementation(() => ({ name: api })),
    view: jest.fn(),
    inspect: jest.fn()
  }
  if (executeError) {
    unit.execute = jest.fn().mockRejectedValue(executeError)
  } else {
    unit.execute = jest.fn().mockResolvedValue(execute)
  }
  return unit
}
