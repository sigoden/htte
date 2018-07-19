const utils = require('htte-utils');
const _ = require('lodash');

function Macro(defs, parent = null) {
  this.parent = parent;
  this.defs = defs;
}

Macro.prototype.scope = function(defs) {
  return new Macro(defs, this);
};

Macro.prototype.search = function(key) {
  if (this.defs[key]) return this.defs[key];
  if (this.parent) return this.parent.search(key);
  throw new Error(`cannot find definition ${key}`);
};

Macro.prototype.resolve = function(unit) {
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

module.exports = Macro;
