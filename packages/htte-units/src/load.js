const path = require('path');
const utils = require('htte-utils');
const _ = require('lodash');
const fs = require('fs');
const validator = require('htte-schema-validator');
const { ValidateError } = require('htte-errors');
const yaml = require('js-yaml');

module.exports = function load(config, schema) {
  let modules = {};
  let dir = path.resolve(config.baseDir, 'modules');
  for (let item of config.modules) {
    item = utils.trimYamlExt(item);
    let name = utils.nameFromPath(item);
    try {
      let file = resolveYaml(dir, item.replace(/\//g, path.sep));
      let content = fs.readFileSync(file, 'utf8');
      modules[name] = yaml.load(content, { schema });
    } catch (err) {
      throw new Error(`cannot load module ${item} because of ${err.message}`);
    }
    if (!validator.module(modules[name])) {
      throw new ValidateError(`modules ${name}`, validator.module.errors);
    }
  }
  return modules;
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
  throw new Error('cannot find yaml file');
}
