const path = require('path');
const _ = require('lodash');
const utils = require('htte-utils');
const Session = require('htte-session');
const EventEmitter = require('events');
const runner = require('htte-runner');
const loadUnits = require('htte-units');

const pkg = require('../package.json');
const loadConfig = require('./load-config');
const loadExtensions = require('./load-extensions');

exports.init = function(options) {
  let { configFile, patch } = options;
  let config = loadConfig(configFile, patch);
  let htteConfig = {
    baseDir: config.baseDir,
    version: pkg.version
  };
  let session = Session(getSessionFile(config));
  let { clients, reporters, plugins } = loadExtensions(config, htteConfig);
  let units = loadUnits({ config, plugins });

  let app = {};
  app.run = function(controls) {
    let emitter = new EventEmitter();
    return runner.run({ session, clients, reporters, units, emitter, controls });
  };
  return app;
};

function getSessionFile(config) {
  if (!config.session) return utils.tmpfile(config.configFile);
  return path.resolve(config.baseDir, config.session);
}
