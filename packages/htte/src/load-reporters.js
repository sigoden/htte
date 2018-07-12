const path = require('path');
const _ = require('lodash');
const defaultReporters = [{ name: 'cli', pkg: 'htte-reporter-cli', options: {} }];

module.exports = function loadReporters(dir, htteConfig, reporters = defaultReporters) {
  if (!_.isArray(reporters)) {
    throw new Error('reporters must be array');
  }
  let result = {};
  for (let item of reporters) {
    if (!_.isString(item.name)) {
      throw new Error(`reporter must have property name, wrong reporter ${JSON.stringify(item)}`);
    }
    if (!_.isString(item.pkg)) {
      throw new Error(`reporter must have property pkg, wrong reporter ${JSON.stringify(item)}`);
    }
    result[item.name] = requireReporter(dir, item.pkg)(htteConfig, item.options || {});
  }
  return result;
};

function requireReporter(dir, name) {
  try {
    return require(path.resolve(dir, name));
  } catch (err) {}
  try {
    return require(name);
  } catch (err) {}

  throw new Error(`reporter ${name} cannot be loaded`);
}
