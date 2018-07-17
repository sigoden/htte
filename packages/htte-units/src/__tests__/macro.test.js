const Macro = require('../macro');

describe('Macro', function() {
  describe('#search', function() {
    test('use value in current scope preffer', function() {
      let parent = { v: { a: 1 } };
      let child = { v: { b: 2 } };
      let macro = new Macro(parent).scope(child);
      expect(macro.search('v')).toBe(child.v);
    });
    test('search value follow the chain', function() {
      let parent = { p: { a: 1 } };
      let child = { c: { b: 2 } };
      let macro = new Macro(parent).scope(child);
      expect(macro.search('p')).toBe(parent.p);
    });
    test('throw error if exhaust the chain', function() {
      let parent = { p: { a: 1 } };
      let child = { c: { b: 2 } };
      let macro = new Macro(parent).scope(child);
      expect(() => macro.search('n')).toThrow();
    });
  });
  describe('#resolve', function() {
    test('works on includes with single value', function() {
      let defines = { auth: { req: { url: '/auth' } } };
      let macro = new Macro(defines);
      let unit = { includes: 'auth', req: { body: {} } };
      macro.resolve(unit);
      expect(unit.req).toEqual({ body: {}, url: '/auth' });
    });
    test('works on includes with multiple value', function() {
      let defines = { http: { client: 'http' }, auth: { req: { url: '/auth' } } };
      let macro = new Macro(defines);
      let unit = { includes: ['auth', 'http'], req: { body: {} } };
      macro.resolve(unit);
      expect(unit.req).toEqual({ body: {}, url: '/auth' });
      expect(unit.client).toEqual('http');
    });
    test('only merge properties client, req, res', function() {
      let defines = { auth: { req: { url: '/auth' }, other: {} } };
      let macro = new Macro(defines);
      let unit = { includes: 'auth', req: { body: {} } };
      macro.resolve(unit);
      expect(unit.other).toBeUndefined();
    });
  });
});
