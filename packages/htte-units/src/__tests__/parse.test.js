const parse = require('../parse');
const Macro = require('../macro');

describe('parse', function() {
  test('should parse single unit', function() {
    let unit = { client: 'http', describe: 'test1', req: { url: '/login' } };
    let macro = new Macro({});
    let result = parse('m1', [unit], macro);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      client: 'http',
      ctx: { macro, firstChild: true, groups: [], module: 'm1' },
      describe: 'test1',
      index: 0,
      session: {},
      metadata: {},
      name: 'fijjonmc',
      req: { url: '/login' },
      res: {}
    });
  });
  test('should parse deep nested unit', function() {
    let unit = {
      describe: 'g1',
      units: [
        {
          describe: 'g2',
          units: [{ client: 'http', describe: 'test1', req: { url: '/login' } }]
        }
      ]
    };
    let macro = new Macro({});
    let result = parse('m1', [unit], macro);
    expect(result).toHaveLength(1);
    expect(result[0].ctx.groups).toEqual(['g1', 'g2']);
  });
  test('should include group defines', function() {
    let unit = {
      describe: 'g1',
      defines: {
        200: {
          res: {
            status: 200
          }
        }
      },
      units: [{ client: 'http', includes: '200', describe: 'test1', req: { url: '/login' } }]
    };
    let macro = new Macro({});
    let result = parse('m1', [unit], macro);
    expect(result).toHaveLength(1);
    expect(result[0].res).toEqual({ status: 200 });
  });
});
