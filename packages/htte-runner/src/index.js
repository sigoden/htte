const _ = require('lodash');
const CURSOR_KEY = 'metadata.cursor';
const runUnit = require('./run-unit');

function run({ session, clients, reporters, emitter, units, controls }) {
  Object.keys(reporters).forEach(function(name) {
    let reporter = reporters[name];
    reporter({ emitter });
  });
  let hrstart = process.hrtime();
  emitter.emit('start', { units, tdd: controls.bail });
  let cursor = 0;
  if (controls.continue) {
    session.load();
    let startAt = session.get(CURSOR_KEY);
    if (startAt) cursor = startAt;
  }
  let stopAt = stopUnitAt(units, cursor);
  let tasks = units.slice(cursor, stopAt).map(function(unit, index) {
    return runUnit(unit);
  });
  let stop = false;
  let isAllSuccess = true;
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
            isAllSuccess = false;
            emitter.emit('errorUnit', err);
            if (controls.bail) stop = true;
          });
      });
    }, Promise.resolve())
    .then(function() {
      session.save();
      let [s, n] = process.hrtime(hrstart);
      let duration = s * 1000 + Math.round(n / 1000000);
      emitter.emit('done', { units, duration });
      return isAllSuccess;
    });
}

function stopUnitAt(units, cursor) {
  let i = cursor;
  for (; i < units.length; i++) {
    let unit = units[i];
    if (unit.metadata.stop) break;
  }
  return i + 1;
}

exports.run = run;
