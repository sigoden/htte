const path = require('path');
const yaml = require('js-yaml');
const _ = require('lodash');
const fs = require('fs');

module.exports = function loadConfig(baseFile, patch) {
  let baseDir = getBaseDir(baseFile);
  let patchFile = getPatchFile(baseFile, patch);
  let baseConfig = yaml.load(path.resolve(baseDir, baseFile));
  let patchConfig = yaml.load(path.resolve(patchDir, patchFile));
  let config =  _.merge(baseConfig, patchConfig);
  config.baseDir = baseDir;
  return config;
}

function getBaseDir(baseFile) {
  return path.dirname(path.resolve(baseFile));
}

function getPatchFile(baseFile, patch) {
  let [filename, extname] = path.basename(baseFile).split('.');
  return [filename, patch, extname].join('.');
}
