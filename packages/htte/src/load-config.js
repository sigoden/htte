const path = require('path');
const yaml = require('js-yaml');
const fs = require('fs');
const { applyPatch } = require('fast-json-patch');
const validator = require('htte-schema-validator');
const { ValidateError } = require('htte-errors');

module.exports = function loadConfig(configFile, patch) {
  configFile = path.resolve(configFile);

  let baseDir = getBaseDir(configFile);
  let config = loadYaml(configFile);
  config.baseDir = baseDir;
  config.configFile = configFile;
  if (!validator.config(config)) {
    throw new ValidateError('config', validator.config.errors);
  }
  if (patch) {
    let patchFile = getPatchFile(configFile, patch);
    let patchOps = loadYaml(path.resolve(baseDir, patchFile));
    if (!validator.patch(patchOps)) {
      throw new ValidateError('patch', validator.patch.errors);
    }
    applyPatch(config, patchOps, false, true);
  }
  return config;
};

function getBaseDir(configFile) {
  return path.dirname(path.resolve(configFile));
}

function getPatchFile(configFile, patch) {
  let [filename, extname] = path.basename(configFile).split('.');
  return [filename, patch, extname].join('.');
}

function loadYaml(file, options) {
  return yaml.safeLoad(fs.readFileSync(file, 'utf8'));
}
