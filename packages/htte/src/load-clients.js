const path = require('path');
const _ = require('lodash');
const defaultClients = [{ name: 'http', pkg: 'htte-client-http', options: {} }];

module.exports = function loadClients(dir, htteConfig, clients = defaultClients) {
  if (!_.isArray(clients)) {
    throw new Error('clients must be array');
  }
  let result = {};
  for (let item of clients) {
    if (!_.isString(item.name)) {
      throw new Error(`client must have property name, wrong client ${JSON.stringify(item)}`);
    }
    if (!_.isString(item.pkg)) {
      throw new Error(`client must have property pkg, wrong client ${JSON.stringify(item)}`);
    }
    result[item.name] = requireClient(dir, item.pkg)(htteConfig, item.options);
  }
  return result;
};

function requireClient(dir, name) {
  try {
    return require(path.resolve(dir, name));
  } catch (err) {}
  try {
    return require(name);
  } catch (err) {}

  throw new Error(`clients ${name} cannot be loaded`);
}
