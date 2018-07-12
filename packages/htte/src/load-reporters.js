const path = require('path');
const _ = require('lodash');
const defaultReporters = [{ name: 'htte-reporter-cli', options: {} }];

module.exports = function loadReporters(dir, reporters = defaultReporters) {
  if (!_.isArray(reporters)) {
    throw new Error('reporters must be array');
  }
  let result = {};
  for (let item of plugins) {
    result[item] = requireReporter(dir, item.name)(options);
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
