const initSession = require('../');
const path = require('path');
const utils = require('htte-utils');

const tmpfile = utils.tmpfile(path.resolve(__dirname, 'htte-session'));

const session = initSession(tmpfile);

describe('session', function() {
  test('get & set', function() {
    let values = [['a.b.c', 3], ['a.d[0]', { a: 3 }], ['a.d[1]', [2, 4]], ['a.f', true]];
    values.map(([path, value]) => {
      session.set(path, value);
      expect(session.get(path)).toEqual(value);
    });
  });
  test('save', function() {
    expect(() => session.save()).not.toThrow();
  });
  test('load', function() {
    expect(session.load()).toEqual({ a: { b: { c: 3 }, d: [{ a: 3 }, [2, 4]], f: true } });
  });
});
