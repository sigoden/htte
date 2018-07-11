const _ = require('lodash');

module.exports = function (store, unit) {
  return function (path) {
    let result;
    let ns = [unit.ctx.module, unit.name];
    while (ns.length > -1) {
      result = _.get(store, ns.concat(path).join('.'));
      if (!_.isUndefined(result)) return result;
      ns.splice(-1, 1);
    }
    throw new Error(`query ${path} get nothing`);
  };
};