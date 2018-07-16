const diff = require('../');

let context = {
  throw: err => {
    throw err;
  },
  enter: jest.fn(() => context),
  toResolver: () => context
};

afterEach(function() {
  jest.clearAllMocks();
});

describe('diff', function() {
  test('diff primitive', function() {
    expect(() => diff(context, 1, 1)).not.toThrow();
    expect(() => diff(context, 1, 2)).toThrow('diff value');
    expect(() => diff(context, true, true)).not.toThrow();
    expect(() => diff(context, true, false)).toThrow('diff value');
    expect(() => diff(context, 'abc', 'abc')).not.toThrow();
    expect(() => diff(context, 'abc', 'cba')).toThrow('diff value');
    expect(() => diff(context, null, null)).not.toThrow('diff value');
    expect(() => diff(context, undefined, undefined)).not.toThrow();
    expect(() => diff(context, null, undefined)).toThrow('diff value');
  });
  test('diff function', function() {
    let fn1 = jest.fn();
    let fn2 = () => {
      throw new Error('foo');
    };
    let v = {};
    expect(() => diff(context, fn1, v)).not.toThrow();
    expect(fn1.mock.calls[0][0]).toBe(context);
    expect(fn1.mock.calls[0][1]).toBe(v);
    expect(() => diff(context, fn2, v)).toThrow('foo');
  });
  test('resolve the resolver then diff', function() {
    let value = {};
    let fn = jest.fn(() => value);
    fn.type = 'resolver';
    expect(() => diff(context, fn, value)).not.toThrow();
  });
  test('diff diffArray', function() {
    expect(() => diff(context, [1, 2, 3], [1, 2, 3])).not.toThrow();
    expect(() => diff(context, [1, 2, 3], [1, 2, 4])).toThrow('diff value');
    expect(() => diff(context, [1, 2], [1, 2, 3])).toThrow('diff size');
    expect(() => diff(context, [1, 2], [1, 2, 3], false)).not.toThrow();
    expect(() => diff(context, [1, 2], { '1': 1, '2': 2 })).toThrow('diff type');
  });
  test('diff object', function() {
    expect(() => diff(context, { a: 3, b: 4 }, { a: 3, b: 4 })).not.toThrow();
    expect(() => diff(context, { a: 3, b: 4 }, { a: 3, b: 5 })).toThrow('diff value');
    expect(() => diff(context, { a: 3, b: 4 }, { a: 3 })).toThrow('diff properties');
    expect(() => diff(context, { a: 3 }, { a: 3, b: 4 })).toThrow('diff properties');
    expect(() => diff(context, { a: 3, b: 4 }, { a: 3 }, false)).not.toThrow('diff properties');
    expect(() => diff(context, { a: 3 }, ['a', 3])).toThrow();
  });
});
