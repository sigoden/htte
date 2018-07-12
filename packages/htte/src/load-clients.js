const path = require('path');
const _ = require('lodash');
const defaultClients = [{name: 'htte-client-http', options: {}}];

module.exports = function loadClients(dir, clients = defaultClients) {
  if (!_.isArray(clients)) {
    throw new Error('clients must be array');
  }
  let result = {};
  for (let item of plugins) {
    result[item.name] = requireClient(dir, item.pkg)(options);
  }
  return result;
}

function requireClient(dir, name) {
  try {
    return require(path.resolve(dir, name));
  } catch (err) { }
  try {
    return require(name);
  } catch (err) { }

  throw new Error(`clients ${name} cannot be loaded`);
}