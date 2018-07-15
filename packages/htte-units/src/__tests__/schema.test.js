const createSchema = require('../create-schema');
const yaml = require('js-yaml');

describe('schema', function() {
  test('apply plugins to yaml schema', function() {
    let plugins = {
      myp: [{ name: 'test', kind: 'scalar', diff: () => {} }, { name: 'test', kind: 'scalar', resolve: () => {} }]
    };
    let schmea = createSchema(plugins);
    expect(schmea).toBeInstanceOf(yaml.Schema);
    expect(schmea.explicit[0].tag).toBe('!@myp/test');
    expect(schmea.explicit[1].tag).toBe('!$myp/test');
  });
});
