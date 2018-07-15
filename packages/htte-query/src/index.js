const _ = require('lodash');

module.exports = function(store, unit) {
  return function(path) {
    let result;

    result = _.get(store, [unit.ctx.module, unit.name].concat(path).join('.'));
    if (!_.isUndefined(result)) return result;

    result = _.get(store, [unit.ctx.module].concat(path).join('.'));
    if (!_.isUndefined(result)) return result;

    result = _.get(store, path);
    if (!_.isUndefined(result)) return result;

    throw new Error(`cannot query ${path}`);
  };
};
