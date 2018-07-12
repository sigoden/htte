const EventEmitter = require('events');
const _ = require('lodash');
const context = require('htte-context');

function run(options) {
  let { session, clients, units, reporters, controls } = options;
  let emitter = new EventEmitter();
  Object.keys(reporters).forEach(function(name) {
    let reporter = reporters[name];
    reporter(emitter);
  });
  emitter.emit('start', options);
  let cursor = getCursor(session, controls);
  let pauseAt = findPauseIndex(units, cursor);
  let tasks = units.slice(cursor, pauseAt).map(function(unit, index) {
    return runUnit(unit, cursor);
  });
  let stop = false;
  return tasks
    .reduce(function(promise, task) {
      return promise.then(function() {
        if (stop) return Promise.resolve();
        return task(session, clients, emitter)
          .then(function() {
            emitter.emit('doneUnit');
          })
          .catch(function(err) {
            emitter.emit('failUnit');
            return emitter.emit('error', err);
            if (controls.bail) stop = true;
          });
      });
    }, Promise.resolve())
    .then(function() {
      if (stop) {
        emitter.emit('stop', options);
        return;
      }
      emitter.emit('done', options);
    });
}

function getCursor(session, controls) {
  if (controls.continue) {
    return session.get('metadata.cursor') || 0;
  }
  return 0;
}

function runUnit(unit, cursor) {
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
      session.set([unit.ctx.module, unit.name, 'req'].join('.'), req);
      client.run(req, unit.res).then(function(res) {
        session.set([unit.ctx.module, unit.name, 'res'].join('.'), res);
        if (res.err) reject(err);
        let differ = context.differ(session.get('data'), unit);
        try {
          Object.keys(unit.res).forEach(function(key) {
            differ.enter(key).diff(unit.res[key], res[key], true);
          });
        } catch (err) {
          reject(err);
        }
        session.set('metadata.cusor', cursor);
        if (unit.metadata.debug) {
          emitter.emit('debugUnit', { unit, req, res });
        }
        resolve();
      });
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
