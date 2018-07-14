const path = require('path');
const _ = require('lodash');
const defaultPlugins = [{ pkg: 'htte-plugin-builtin', options: {} }];

module.exports = function loadPlugins(dir, htteConfig, plugins = defaultPlugins) {
  if (!_.isArray(plugins)) {
    throw new Error('plugins must be array');
  }
  let yamlTags = [];
  for (let item of plugins) {
    if (!_.isString(item.pkg)) {
      throw new Error(`plugin must have property pkg, wrong plugin ${JSON.stringify(item)}`);
    }
    item.options = item.options || {};
    if (!_.isPlainObject(item.options)) {
      throw new Error(`plugin property options must be object, wrong plugin ${JSON.stringify(item)}`);
    }
    let plugin = requirePlugin(dir, item.pkg);
    yamlTags = yamlTags.concat(plugin(htteConfig, item.options));
  }
  return yamlTags;
};

function requirePlugin(dir, name) {
  try {
    return require(path.resolve(dir, name));
  } catch (err) {}
  try {
    return require(name);
  } catch (err) {}

  throw new Error(`plugins ${name} cannot be loaded`);
}
