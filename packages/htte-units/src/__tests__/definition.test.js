const Definition = require('../definition');

describe('Definition', function() {
  describe('#search', function() {
    test('use value in current scope preffer', function() {
      let parent = { v: { a: 1 } };
      let child = { v: { b: 2 } };
      let def = new Definition(parent).scope(child);
      expect(def.search('v')).toBe(child.v);
    });
    test('search value follow the chain', function() {
      let parent = { p: { a: 1 } };
      let child = { c: { b: 2 } };
      let def = new Definition(parent).scope(child);
      expect(def.search('p')).toBe(parent.p);
    });
    test('throw error if exhaust the chain', function() {
      let parent = { p: { a: 1 } };
      let child = { c: { b: 2 } };
      let def = new Definition(parent).scope(child);
      expect(() => def.search('n')).toThrow();
    });
  });
  describe('#resolve', function() {
    test('works on includes with single value', function() {
      let defines = { auth: { req: { url: '/auth' } } };
      let def = new Definition(defines);
      let unit = { includes: 'auth', req: { body: {} } };
      def.resolve(unit);
      expect(unit.req).toEqual({ body: {}, url: '/auth' });
    });
    test('works on includes with multiple value', function() {
      let defines = { http: { client: 'http' }, auth: { req: { url: '/auth' } } };
      let def = new Definition(defines);
      let unit = { includes: ['auth', 'http'], req: { body: {} } };
      def.resolve(unit);
      expect(unit.req).toEqual({ body: {}, url: '/auth' });
      expect(unit.client).toEqual('http');
    });
    test('only merge properties client, req, res', function() {
      let defines = { auth: { req: { url: '/auth' }, other: {} } };
      let def = new Definition(defines);
      let unit = { includes: 'auth', req: { body: {} } };
      def.resolve(unit);
      expect(unit.other).toBeUndefined();
    });
  });
});
