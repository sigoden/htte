const jp = require('jsonpath');

module.exports = function (store, unit) {
  return function (path) {
    let result;
    if (!/^\$.+/.test(path)) {
      throw new Error(`query ${path} is invalid`);
    }
    result = jp.query(_.get(store, unit.ctx.module, unit.name), path)
    if (result.length) return result;
    result = jp.query(_.get(store, unit.ctx.module), path)
    if (result.length) return result;
    result = jp.query(_.get(store), path)
    if (result.length) return result;
    throw new Error(`query ${path} get nothing`);
  };
};