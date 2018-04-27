const App = require('../../src/app')
const path = require('path')
const { start } = require('../fixtures/realworld')

const configFile = path.resolve(__dirname, '../fixtures/realworld/tests/config.yaml')

describe('test app', () => {
  let print = jest.fn()
  let app
  beforeEach(() => {
    print.mockClear()
  })
  test('should init app', () => {
    app = new App(configFile, print)
    expect(print).not.toHaveBeenCalled()
  })
  test('should load all the units', () => {
    expect(app._units).toHaveLength(26)
  })
  test('should view all the units', () => {
    app.view({})
    // console.log(print.mock.calls[0][0])
    expect(print.mock.calls[0][0]).toMatch('ViewUnits')
  })
  test('should run all the test success', () => {
    return new Promise((resolve, reject) => {
      start(server => {
        app
          .run({})
          .then(result => {
            server.close()
            expect(result).toBe(0)
            expect(print.mock.calls).toHaveLength(52)
            // console.log(print.mock.calls.map(c => c[0]).join('\n'))
            resolve()
          })
          .catch(reject)
      })
    })
  })
  test('should inspect the unit', () => {
    app.inspect({ unit: 'auth-registerJohn' })
    // console.log(print.mock.calls[0][0])
    expect(print.mock.calls[0][0]).toMatch('name: registerJohn')
  })
})
