const EventEmitter = require('events');
const runUnit = require('../run-unit');
const { ClientError, ContextError } = require('htte-errors');

const session = {
  get: jest.fn(),
  set: jest.fn()
};

const clients = {
  http: jest.fn().mockResolvedValue({}),
  grpc: jest.fn().mockResolvedValue({})
};

const emitter = new EventEmitter();
emitter.emit = jest.fn();

afterEach(() => jest.clearAllMocks());

describe('run-unit', function() {
  test('enter group', function(done) {
    let unit = mockUnit('m1', 'u1', { firstChild: true });
    runUnit(unit)(session, clients, emitter).then(function() {
      expect(emitter.emit.mock.calls[0][0]).toEqual('enterGroup');
      expect(emitter.emit.mock.calls[0][1]).toEqual({ unit });
      expect(emitter.emit.mock.calls[1][0]).toEqual('runUnit');
      done();
    });
  });
  test('skip the unit', function(done) {
    let unit = mockUnit('m1', 'u1', { skip: true });
    runUnit(unit)(session, clients, emitter).then(function() {
      expect(emitter.emit.mock.calls[0][0]).toEqual('skipUnit');
      expect(emitter.emit.mock.calls[0][1]).toEqual({ unit });
      expect(unit.session.state).toBe('skip');
      done();
    });
  });
  test('use default clients', function(done) {
    let unit = mockUnit('m1', 'u1');
    runUnit(unit)(session, clients, emitter).then(function() {
      expect(clients.http).toHaveBeenCalled();
      done();
    });
  });
  test('when not found client', function(done) {
    let unit = mockUnit('m1', 'u1', { client: 'jsonrpc' });
    runUnit(unit)(session, clients, emitter).catch(function(err) {
      expect(err.message).toBe('client jsonrpc is unsupported');
      done();
    });
  });
  test('when resolve req failed', function(done) {
    let unit = mockUnit('m1', 'u1');
    unit.req.body = jest.fn(() => {
      throw new Error('abc');
    });
    runUnit(unit)(session, clients, emitter).catch(function(err) {
      expect(err).toBeInstanceOf(ContextError);
      expect(err.message).toBe('abc');
      done();
    });
  });
  test('bypass ClientError', function(done) {
    let unit = mockUnit('m1', 'u1');
    unit.req.body = jest.fn(() => {
      throw new ClientError('abc', ['req', 'body']);
    });
    runUnit(unit)(session, clients, emitter).catch(function(err) {
      expect(err).toBeInstanceOf(ContextError);
      expect(err.message).toBe('abc');
      expect(err.parts).toEqual(['req', 'body']);
      done();
    });
  });
  test('unit passed', function(done) {
    let unit = mockUnit('m1', 'u1');
    runUnit(unit)(session, clients, emitter).then(function() {
      expect(unit.session).toEqual({ duration: 0, req: { body: {} }, res: {}, state: 'pass' });
      done();
    });
  });
  test('unit failed because of client', function(done) {
    let unit = mockUnit('m1', 'u1');
    clients.http.mockRejectedValue(new Error('abc'));
    runUnit(unit)(session, clients, emitter).catch(function(err) {
      expect(err).toBeInstanceOf(ClientError);
      expect(unit.session).toEqual({ err, req: { body: {} }, state: 'fail' });
      expect(err.message).toBe('abc');
      done();
    });
  });
  test('unit failed because of differ', function(done) {
    let unit = mockUnit('m1', 'u1');
    clients.http.mockResolvedValue({ body: { key: 'v' } });
    unit.res = { body: {} };
    runUnit(unit)(session, clients, emitter).catch(function(err) {
      expect(err).toBeInstanceOf(ContextError);
      expect(err.message).toBe('diff properties, -- key');
      expect(unit.session.state).toBe('fail');
      expect(unit.session.res).toEqual({ body: { key: 'v' } });
      done();
    });
  });
});

function mockUnit(module, name, options = {}) {
  return {
    client: options.client,
    ctx: { module, firstChild: !!options.firstChild },
    metadata: { skip: !!options.skip },
    session: {},
    name,
    req: {
      body: {}
    }
  };
}
