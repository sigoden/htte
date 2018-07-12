const path = require('path');
const _ = require('lodash');
const defaultPlugins = [{pkg: 'htte-plugin-common', options: {}}];

module.exports = function loadPlugins(dir, plugins = defaultPlugins) {
  if (!_.isArray(plugins)) {
    throw new Error('plugins must be array');
  }
  let yamlTags = [];
  for (let item of plugins) {
    let plugin = requirePlugin(dir, item.pkg);
    yamlTags = yamlTags.concat(plugin(item.options));
  }
  return yamlTags;
}

function requirePlugin(dir, name) {
  try {
    return require(path.resolve(dir, name));
  } catch (err) { }
  try {
    return require(name);
  } catch (err) { }

  throw new Error(`plugins ${name} cannot be loaded`);
}