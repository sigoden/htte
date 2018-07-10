module.exports = function loadPlugins(baseDir, plugins) {
  if (!Array.isArray(plugins)) {
    throw new Error('plugins must be array');
  }
  let yamlTags = [];
  let dir = path.resolve(baseDir, 'plugins');
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