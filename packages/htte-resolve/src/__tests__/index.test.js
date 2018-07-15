const resolve = require('../');

let context = {
  throw: err => {
    throw err;
  },
  enter: jest.fn(() => context)
};

afterEach(function() {
  jest.clearAllMocks();
});

describe('resolve', function() {
  test('resolve primitive', function() {
    expect(resolve(context, true)).toBe(true);
    expect(resolve(context, 1.2)).toBe(1.2);
    expect(resolve(context, 'abc')).toBe('abc');
    expect(resolve(context, null)).toBe(null);
    expect(resolve(context, undefined)).toBe(undefined);
  });
  test('resolve function', function() {
    let v = {};
    let fn1 = jest.fn(() => v);
    let fn2 = jest.fn(() => {
      throw new Error('foo');
    });
    expect(resolve(context, fn1)).toBe(v);
    expect(fn1.mock.calls[0][0]).toBe(context);
    expect(() => resolve(context, fn2)).toThrow('foo');
  });
  test('resolve array', function() {
    let fn1 = jest.fn(() => 2);
    expect(resolve(context, [1, 2, 3])).toEqual([1, 2, 3]);
    expect(resolve(context, [1, fn1, 3])).toEqual([1, 2, 3]);
  });
  test('resolve object', function() {
    let fn1 = jest.fn(() => 4);
    expect(resolve(context, { a: 3, b: 4 })).toEqual({ a: 3, b: 4 });
    expect(resolve(context, { a: 3, b: fn1 })).toEqual({ a: 3, b: 4 });
  });
});
