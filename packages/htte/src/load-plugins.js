const path = require('path');
const _ = require('lodash');

module.exports = function loadPlugins(dir, plugins) {
  if (!_.isArray(plugins)) {
    throw new Error('plugins must be array');
  }
  let yamlTags = [];
  for (let item of plugins) {
    let plugin = requirePlugin(dir, item.name);
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