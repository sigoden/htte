const path = require('path');
const yaml = require('js-yaml');
const fs = require('fs');

module.exports = function loadConfig(baseFile, patch) {
  let baseDir = getBaseDir(baseFile);
  let config = loadYaml(baseFile);
  if (patch) {
    let patchFile = getPatchFile(baseFile, patch);
    let patchConfig = loadYaml(path.resolve(patchDir, patchFile));
    config = _.merge(baseConfig, patchConfig);
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
