const context = require('htte-context');
const _ = require('lodash');
const { ClientError } = require('htte-errors');

module.exports = function(unit) {
  return function(session, clients, emitter) {
    return new Promise(function(resolve, reject) {
      if (unit.ctx.firstChild) {
        emitter.emit('enterGroup', { unit });
      }
      if (unit.metadata.skip) {
        emitter.emit('skipUnit', { unit });
        unit.session.state = 'skip';
        return resolve();
      }
      emitter.emit('runUnit', { unit });
      let client;
      if (_.isUndefined(unit.client)) {
        client = clients[Object.keys(clients)[0]];
      } else {
        client = clients[unit.client];
      }
      if (!client) return reject(new ClientError(`client ${unit.client} is unsupported`));
      let resolver = new context.Resolver(session.get('data'), unit, ['req']);
      let req;
      try {
        req = resolver.resolve(unit.req);
      } catch (err) {
        reject(err);
      }
      unit.session.req = req;
      session.set(['data', unit.ctx.module, unit.name, 'req'].join('.'), req);
      let hrstart = process.hrtime();
      client({ req, res: unit.res })
        .then(function(res) {
          let [s, n] = process.hrtime(hrstart);
          unit.session.duration = s * 1000 + Math.round(n / 1000000);
          unit.session.res = res;
          session.set(['data', unit.ctx.module, unit.name, 'res'].join('.'), res);
          if (unit.res) {
            let differ = new context.Differ(session.get('data'), unit, ['res']);
            try {
              Object.keys(unit.res).forEach(function(key) {
                differ.enter(key).diff(unit.res[key], res[key], true);
              });
            } catch (err) {
              reject(err);
            }
          }
          unit.session.state = 'pass';
          resolve();
        })
        .catch(function(err) {
          if (!(err instanceof ClientError)) {
            reject(new ClientError(err.message));
            return;
          }
          reject(err);
        });
    }).catch(function(err) {
      unit.session.state = 'fail';
      unit.session.err = err;
      return Promise.reject(err);
    });
  };
};
