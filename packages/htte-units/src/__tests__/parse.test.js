const parse = require('../parse');
const Definition = require('../definition');

describe('parse', function() {
  test('should parse single unit', function() {
    let unit = { client: 'http', describe: 'test1', req: { url: '/login' } };
    let def = new Definition({});
    let result = parse('m1', [unit], def);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      client: 'http',
      ctx: { def, firstChild: true, groups: [], module: 'm1' },
      describe: 'test1',
      index: 0,
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
    let def = new Definition({});
    let result = parse('m1', [unit], def);
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
    let def = new Definition({});
    let result = parse('m1', [unit], def);
    expect(result).toHaveLength(1);
    expect(result[0].res).toEqual({ status: 200 });
  });
});
