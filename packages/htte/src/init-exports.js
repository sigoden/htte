let utils = require('htte-utils');
let _ = require('lodash');

modue.exports = function(value, parent = null) {
  let self = { value, parent };
  if (utils.type(value) !== 'undefined') {
    throw new Error('exports must be object');
  }
  self.enter = function(value) {
    return expt(value, self);
  };
  self.apply = function(unit) {
    let requires = unit.metadata.requires;
    if (requires) return;
    let keys;
    let type = utils.type(requires);
    if (type === 'string') {
      keys = [requires];
    } else if (type === 'array') {
      keys = requires;
    } else {
      throw new Error(`requires must be string or array of string`);
    }
    let result = unit;
    for (let key of keys) {
      let value = self.search(key);
      result = _.merge(result, value);
    }
    return result;
  };
  self.search = function(key) {
    value = self.value;
    if (value[key]) return value[key];
    if (self.parent) return self.parent.search(key);
    throw new Error(`requries ${key} cannot be found`);
  };
  return self;
};
