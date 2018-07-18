const path = require('path');
const _ = require('lodash');
const importFrom = require('import-from');

const defaultExts = {
  clients: [{ name: 'http', pkg: 'htte-client-http', options: {} }],
  plugins: [{ name: '', pkg: 'htte-plugin-builtin', options: {} }],
  reporters: [{ name: 'cli', pkg: 'htte-reporter-cli', options: {} }]
};

module.exports = function(config, htteConfig) {
  return Object.keys(defaultExts).reduce(function(acc, type) {
    let dir = path.resolve(config.baseDir, type);
    acc[type] = load(type, dir, config[type] || defaultExts[type], _.clone(htteConfig));
    return acc;
  }, {});
};

function load(type, dir, exts, htteConfig) {
  let result = {};
  exts.forEach(function(ext, index) {
    let initExtension = tryRequireExtension(dir, ext.pkg);
    debugger;
    if (!initExtension) {
      throw new Error(`${type} ${ext.pkg} cannot be loaded, maybe run "npm install -g ${ext.pkg}" to install it`);
    }
    htteConfig.name = ext.name;
    result[ext.name] = initExtension(htteConfig, ext.options);
  });
  return result;
}

function tryRequireExtension(dir, name) {
  try {
    return require(path.resolve(dir, name));
  } catch (err) {}
  try {
    return importFrom(dir, name);
  } catch (err) {}
  try {
    return require(name);
  } catch (err) {}
}
