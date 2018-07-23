const loadExtensions = require('../load-extensions');
const path = require('path');

describe('loadExtensions', function() {
  test('load default extensions', function() {
    let config = { baseDir: path.resolve(__dirname, './fixtures') };
    let { clients, reporters, plugins } = loadExtensions(config, {});
    expect(clients['http']).toBeDefined();
    expect(reporters['cli']).toBeDefined();
    expect(plugins['']).toBeDefined();
  });
  test('load use extensions', function() {
    let config = {
      baseDir: path.resolve(__dirname, './fixtures'),
      clients: [{ name: 'c', pkg: 'clients/rpc', options: {} }],
      reporters: [{ name: 'r', pkg: 'reporters/html', options: {} }],
      plugins: [{ name: 'p', pkg: 'plugins/faker', options: {} }]
    };
    let { clients, reporters, plugins } = loadExtensions(config, {});
    expect(clients['c']).toBeDefined();
    expect(reporters['r']).toBeDefined();
    expect(plugins['p']).toBeDefined();
  });
});
