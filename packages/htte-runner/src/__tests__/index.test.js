const EventEmitter = require('events');
const runner = require('../');

jest.mock(
  '../run-unit',
  () =>
    function(unit) {
      if (unit.err) {
        return jest.fn().mockRejectedValue();
      }
      return jest.fn().mockResolvedValue();
    }
);

const session = {
  load: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  save: jest.fn()
};

const reporters = {
  cli: jest.fn(),
  html: jest.fn()
};

const clients = {};

const emitter = new EventEmitter();
emitter.emit = jest.fn();

afterEach(() => jest.clearAllMocks());

describe('run', function() {
  test('all reporters got the emitter', function(done) {
    runner.run({ session, clients, reporters, units: [], emitter, controls: {} }).then(function() {
      expect(reporters.cli.mock.calls[0][0]).toEqual({ emitter });
      expect(reporters.html.mock.calls[0][0]).toEqual({ emitter });
      done();
    });
  });
  test('emitted events when done', function(done) {
    let unit = { metadata: {} };
    let units = [unit];
    runner.run({ session, clients, reporters, units, emitter, controls: {} }).then(function() {
      expect(emitter.emit.mock.calls[0][0]).toBe('start');
      expect(emitter.emit.mock.calls[0][1]).toEqual({ units });
      expect(emitter.emit.mock.calls[1][0]).toBe('doneUnit');
      expect(emitter.emit.mock.calls[2][0]).toBe('done');
      expect(emitter.emit.mock.calls[2][1].units).toBe(units);
      expect(emitter.emit.mock.calls[2][1].duration).toBeDefined();
      expect(session.set).toHaveBeenCalledWith('metadata.cursor', 1);
      done();
    });
  });
  test('emitted events when error', function(done) {
    let unit = { metadata: {}, err: true };
    let units = [unit];
    runner.run({ session, clients, reporters, units, emitter, controls: {} }).then(function() {
      expect(emitter.emit.mock.calls[0][0]).toBe('start');
      expect(emitter.emit.mock.calls[0][1]).toEqual({ units });
      expect(emitter.emit.mock.calls[1][0]).toBe('errorUnit');
      expect(emitter.emit.mock.calls[2][0]).toBe('done');
      expect(emitter.emit.mock.calls[2][1].units).toBe(units);
      expect(emitter.emit.mock.calls[2][1].duration).toBeDefined();
      done();
    });
  });
  test('start from special units when controls.continue is enabled', function(done) {
    let units = [{ metadata: {} }, { metadata: {} }, { metadata: {} }];
    session.get.mockReturnValue(1);
    runner.run({ session, clients, reporters, units, emitter, controls: { continue: true } }).then(function() {
      expect(session.set.mock.calls).toHaveLength(2);
      expect(session.set.mock.calls[0][1]).toBe(2);
      done();
    });
  });
  test('stop running when meets unit.metadata.stop', function(done) {
    let units = [{ metadata: {} }, { metadata: { stop: true } }, { metadata: {} }];
    session.get.mockReturnValue(1);
    runner.run({ session, clients, reporters, units, emitter, controls: {} }).then(function() {
      expect(session.set.mock.calls).toHaveLength(2);
      expect(session.set.mock.calls[1][1]).toBe(2);
      done();
    });
  });
  test('load session when controls.continue is enabled', function(done) {
    runner.run({ session, clients, reporters, units: [], emitter, controls: { continue: true } }).then(function() {
      expect(session.load).toHaveBeenCalled();
      expect(session.get.mock.calls[0][0]).toBe('metadata.cursor');
      done();
    });
  });
  test('save session after finish', function(done) {
    runner.run({ session, clients, reporters, units: [], emitter, controls: { continue: true } }).then(function() {
      expect(session.save).toHaveBeenCalled();
      done();
    });
  });
});
