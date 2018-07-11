const path = require('path');
const _ = require('lodash');

module.exports = function loadModules(dir, mods, yamlLoader) {
  if (!_.isArray(mods)) {
    throw new Error('modules must be array');
  }
  let result = {};
  for (let item of mods) {
    let name = item.replace(/\//g, '');
    result[name] = yamlLoader(path.resolve(dir, item.replace(/\//g, path.sep)));
  }
  return result;
}