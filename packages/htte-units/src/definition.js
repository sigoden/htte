const utils = require('htte-utils');
const _ = require('lodash');

function Definition(defs, parent = null) {
  this.parent = parent;
  this.defs = defs;
}

Definition.prototype.scope = function(defs) {
  return new Definition(defs, this);
};

Definition.prototype.search = function(key) {
  if (this.defs[key]) return this.defs[key];
  if (this.parent) return this.parent.search(key);
  throw new Error(`cannot find definition ${key}`);
};

Definition.prototype.resolve = function(unit) {
  let includes = unit.includes;
  if (!includes) return unit;
  if (utils.type(includes) === 'string') {
    includes = [includes];
  }
  for (let inc of includes) {
    let value = this.search(inc);
    _.merge(unit, _.pick(value, ['client', 'req', 'res']));
  }
};

module.exports = Definition;
