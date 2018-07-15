const loadUnits = require('../');
const path = require('path');

describe('loadUnits', function() {
  test('load units from modules', function() {
    let config = { baseDir: path.resolve(__dirname, './fixtures'), modules: ['m1'] };
    let plugins = {}
    let units = loadUnits({ config, plugins });
    expect(units).toHaveLength(1);
  })
});
