const _ = require('lodash');
const utils = require('htte-utils');

function resolve(context, data) {
  switch (utils.type(data)) {
    case 'number':
    case 'boolean':
    case 'string':
    case 'null':
    case 'undefined':
      return data;
    case 'function':
      if (data.type === 'differ') {
        return data;
      }
      try {
        return data(context);
      } catch (err) {
        context.throw(err.message);
      }
    case 'array':
      return data.map(function(elem, index) {
        return resolve(context.enter(`[${index}]`), elem);
      });
    default:
      return _.mapValues(data, function(value, key) {
        return resolve(context.enter(key), value);
      });
  }
}

module.exports = resolve;
