const path = require('path');
const yaml = require('js-yaml');
const fs = require('fs');
const { applyPatch } = require('fast-json-patch');
const validator = require('htte-schema-validator');
const { ValidateError } = require('htte-errors');

module.exports = function loadConfig(baseFile, patch) {
  let baseDir = getBaseDir(baseFile);
  let config = loadYaml(baseFile);
  if (!validator.config(config)) {
    throw new ValidateError('config', validator.config.errors);
  }
  if (patch) {
    let patchFile = getPatchFile(baseFile, patch);
    let patchOps = loadYaml(path.resolve(baseDir, patchFile));
    if (!validator.patch(patchOps)) {
      throw new ValidateError('patch', validator.patch.errors);
    }
    applyPatch(config, patchOps, false, true);
  }
  config.baseDir = baseDir;
  return config;
};

function getBaseDir(baseFile) {
  return path.dirname(path.resolve(baseFile));
}

function getPatchFile(baseFile, patch) {
  let [filename, extname] = path.basename(baseFile).split('.');
  return [filename, patch, extname].join('.');
}

function loadYaml(file, options) {
  return yaml.safeLoad(fs.readFileSync(file, 'utf8'));
}
