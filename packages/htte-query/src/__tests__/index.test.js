const query = require('../');
const store = {
  module: {
    unit: {
      req: {
        query: {
          q: 3
        },
        body: [{ a: 3 }, { a: 4 }]
      }
    }
  },
  metadata: {
    cursor: 33
  }
};

const unit = {
  ctx: {
    module: 'module'
  },
  name: 'unit'
};

describe('query', function() {
  test('find the value at path', function() {
    let q = query(store, unit);
    debugger;
    expect(q('module.unit.req.query.q')).toBe(3);
    expect(q('unit.req.query.q')).toBe(3);
    expect(q('req.query.q')).toBe(3);
    expect(q('req.body[0].a')).toBe(3);
    expect(() => q('req.body[2].a')).toThrow();
  });
});
