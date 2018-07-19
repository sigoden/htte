jest.mock('htte-resolve', () => jest.fn());
jest.mock('htte-query', () => jest.fn());

const Resolver = require('../resolver');
const resolve = require('htte-resolve');
const query = require('htte-query');
const { ContextError } = require('htte-errors');

const store = {};
const unit = {};

function init(parts) {
  return new Resolver(store, unit, parts);
}

afterEach(() => jest.clearAllMocks());

describe('#exec', function() {
  test('wrap yaml tag handler', function() {
    let resolver = init();
    let handler = jest.fn();
    let value = {};
    resolve.mockReturnValue(value);
    handler.type = 'resolver';
    resolver.exec(handler, value);
    expect(resolve).toHaveBeenCalledWith(resolver, value);
    expect(handler).toHaveBeenCalledWith(resolver, value);
    handler.type = 'differ';
    expect(() => resolver.exec(handler, value)).toThrow('expect resolver plugin instead of differ plugin');
  });
});

describe('#enter', function() {
  test('enter child scope', function() {
    let resolver = init();
    let scopedResolver = resolver.enter('abc');
    expect(scopedResolver.parts).toEqual(['abc']);
    expect(scopedResolver).toBeInstanceOf(Resolver);
  });
});

describe('#resolve', function() {
  test('wrap htte-resolve', function() {
    let resolver = init();
    let value = {};
    resolver.resolve(value);
    expect(resolve).toHaveBeenCalledWith(resolver, value);
  });
});

describe('#query', function() {
  let queryInner = jest.fn();
  query.mockReturnValue(queryInner);
  test('wrap htte-query', function() {
    let resolver = init();
    let path = 'req.body.msg';
    resolver.query(path);
    expect(query).toHaveBeenCalledWith(resolver.store, resolver.unit);
    expect(queryInner).toHaveBeenCalledWith(path);
  });
});

describe('#throw', function() {
  test('wrap msg into ContextError then throw', function() {
    let resolver = init(['req', 'body']);
    try {
      resolver.throw('abc');
    } catch (err) {
      expect(err).toBeInstanceOf(ContextError);
      expect(err.message).toBe('abc');
      expect(err.parts).toEqual(['req', 'body']);
    }
  });
});
