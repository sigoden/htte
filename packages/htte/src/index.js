const _ = require('lodash');
const os = require('os');
const path = require('path');
const utils = require('htte-utils');

const runner = require("htte-runner");
const loadConfig = require("./load-config");
const loadClients = require("./load-modules");
const loadPlugins = require("./load-modules");
const loadReporters = require('./load-reporters');
const loadModules = require("./load-modules");
const initModule = require("./init-module");
const initYamlLoader = require("./init-yamlloader");
const initSession = require('./init-session');

exports.init = function(options) {
  let {
    baseFile,
    patch,
    clientsDir = "clients",
    pluginsDir = "plugins",
    modulesDir = "modules",
    reportersDir = "reporters",
  } = options;
  let config = loadConfig(baseFile, patch);
  let clientsDir = path.resolve(config.baseDir, clientsDir);
  let pluginsDir = path.resolve(config.baseDir, pluginsDir);
  let modulesDir = path.resolve(config.baseDir, modulesDir);
  let reportersDir = path.resolve(config.baseDir, reportersDir);
  let clients = loadClients(clientsDir, config.clients);
  let yamlTags = loadPlugins(pluginsDir, config.plugins);
  let reporters = loadReporters(reportersDir, config.reporters);
  let yamlLoader = initYamlLoader(yamlTags);
  let mods = loadModules(config.baseDir, config.modules, yamlLoader);
  let session = initSession(config.session || defaultSessionFile(baseFile));
  let units = _.flatMap(Object.keys(mods).map(function(key) {
    let mod = mods[key];
    return initModule(key, mod, config.exports || {});
  }));
  return { clients, reporters, session, units };
}

function defaultSessionFile(baseFile) {
  let name = path.basename(utils.trimYamlExt(baseFile));
  let file = path.join(os.tmpdir(), name + '-' + utils.md5x(baseFile, 6));
  return file;
}