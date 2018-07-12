const path = require('path');
const utils = require('htte-utils');
const _ = require('lodash');
const fs = require('fs');

module.exports = function loadModules(dir, mods, yamlLoader) {
  if (!_.isArray(mods)) {
    throw new Error('modules must be array');
  }
  let result = {};
  for (let item of mods) {
    item = utils.trimYamlExt(item);
    let name = utils.nameFromPath(item);
    result[name] = yamlLoader(resolveYaml(dir, item.replace(/\//g, path.sep)));
  }
  return result;
};

function resolveYaml(dir, name) {
  let file;
  file = path.resolve(dir, name + '.yaml');
  if (fs.existsSync(file)) {
    return file;
  }
  file = path.resolve(dir, name + '.yml');
  if (fs.existsSync(file)) {
    return file;
  }
  throw new Error(`module ${name} do not find`);
}
