const EventEmitter = require('events');
const _ = require('lodash');
const context = require('htte-context');
const CURSOR_KEY = 'metadata.cursor';

function run(options) {
  let { session, clients, units, reporters, controls } = options;
  let emitter = new EventEmitter();
  Object.keys(reporters).forEach(function(name) {
    let reporter = reporters[name];
    reporter(emitter);
  });
  emitter.emit('start', options);
  let cursor;
  if (controls.continue) {
    session.load();
    cursor = session.get(CURSOR_KEY) || 0;
  }
  let pauseAt = findPauseIndex(units, cursor);
  let tasks = units.slice(cursor, pauseAt).map(function(unit, index) {
    return runUnit(unit);
  });
  let stop = false;
  return tasks
    .reduce(function(promise, task) {
      return promise.then(function() {
        if (stop) return Promise.resolve();
        return task(session, clients, emitter)
          .then(function() {
            session.set(CURSOR_KEY, ++cursor);
            emitter.emit('doneUnit');
          })
          .catch(function(err) {
            emitter.emit('errorUnit', err);
            if (controls.bail) stop = true;
          });
      });
    }, Promise.resolve())
    .then(function() {
      session.save();
      emitter.emit('done');
    });
}

function runUnit(unit) {
  return function(session, clients, emitter) {
    return new Promise(function(resolve, reject) {
      if (unit.ctx.firstChild) {
        emitter.emit('enterGroup', { unit });
      }
      if (unit.metadata.skip) {
        emitter.emit('skipUnit', { unit });
        return Promise.resolve();
      }
      emitter.emit('runUnit', { unit });
      let client;
      if (_.isUndefined(unit.client)) {
        client = clients[Object.keys(clients)[0]];
      } else {
        client = clients[unit.client];
      }
      if (!client) return reject(`client ${unit.client} is unsupported`);
      let resolver = context.resolver(session.get('data'), unit);
      let req;
      try {
        req = resolver.resolve(unit.req);
      } catch (err) {
        reject(err);
      }
      unit.session = { req };
      session.set(['data', unit.ctx.module, unit.name, 'req'].join('.'), req);
      let saveClientData = function(data) {
        unit.session.client = data;
      };
      client
        .run(req, unit.res, saveClientData)
        .then(function(res) {
          unit.session.res = res;
          session.set(['data', unit.ctx.module, unit.name, 'res'].join('.'), res);
          if (unit.res) {
            let differ = context.differ(session.get('data'), unit);
            try {
              Object.keys(unit.res).forEach(function(key) {
                differ.enter(key).diff(unit.res[key], res[key], true);
              });
            } catch (err) {
              reject(err);
            }
          }
          resolve();
        })
        .catch(reject);
    });
  };
}

function findPauseIndex(units, cursor) {
  let i = cursor;
  for (; i < units.length; i++) {
    let unit = units[i];
    if (unit.metadata.pause) return i;
  }
  return i;
}

exports.run = run;
