const path = require('path');
const _ = require('lodash');

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
    try {
      htteConfig.name = ext.name;
      result[ext.name] = tryRequireExtension(dir, ext.pkg)(htteConfig, ext.options);
    } catch (err) {
      throw new Error(`${type} ${ext.pkg} cannot be loaded, maybe run "npm install -g ${ext.pkg}" to install it`);
    }
  });
  return result;
}

function tryRequireExtension(dir, name) {
  try {
    return require(path.resolve(dir, name));
  } catch (err) {}
  return require(name);
}
