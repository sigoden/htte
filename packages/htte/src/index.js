const _ = require('lodash');
const os = require('os');
const path = require('path');
const utils = require('htte-utils');

const runner = require('htte-runner');
const loadConfig = require('./load-config');
const loadClients = require('./load-clients');
const loadPlugins = require('./load-plugins');
const loadReporters = require('./load-reporters');
const loadModules = require('./load-modules');
const initModule = require('./init-module');
const initYamlLoader = require('./init-yamlloader');
const initSession = require('./init-session');
const initExports = require('./init-exports');

exports.init = function(options) {
  let {
    configFile,
    patch,
    clientsDir = 'clients',
    pluginsDir = 'plugins',
    modulesDir = 'modules',
    reportersDir = 'reporters'
  } = options;
  let config = loadConfig(configFile, patch);
  clientsDir = path.resolve(config.baseDir, clientsDir);
  pluginsDir = path.resolve(config.baseDir, pluginsDir);
  modulesDir = path.resolve(config.baseDir, modulesDir);
  reportersDir = path.resolve(config.baseDir, reportersDir);
  let clients = loadClients(clientsDir, config.clients);
  let yamlTags = loadPlugins(pluginsDir, config.plugins);
  let reporters = loadReporters(reportersDir, config.reporters);
  let yamlLoader = initYamlLoader(yamlTags);
  let mods = loadModules(modulesDir, config.modules, yamlLoader);
  let session = initSession(config.session || defaultSessionFile(configFile));
  let expts = initExports(config.exports || {});
  let units = _.flatMap(
    Object.keys(mods).map(function(key) {
      let mod = mods[key];
      return initModule(key, mod, expts);
    })
  );

  let app = {};
  app.run = function(controls) {
    return runner.run({ session, clients, units, reporters, controls });
  };
  return app;
};

function defaultSessionFile(baseFile) {
  let name = path.basename(utils.trimYamlExt(baseFile));
  let file = path.join(os.tmpdir(), name + '-' + utils.md5x(baseFile, 6) + '.json');
  return file;
}
