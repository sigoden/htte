const _ = require('lodash');
const utils = require('htte-utils');

module.exports = function(name, mod, expts) {
  if (!_.isArray(mod)) {
    throw new Error(`module ${name} must be array`);
  }
  let output = [];
  for (let item of mod) {
    if (!_.isString(item.describe)) {
      throw new Error(`module must have property describe, wrong module ${JSON.stringify(item)}`);
    }
    if (item.units) {
      procGroup(output, { module: name, groups: [item.describe], expts }, item);
    } else {
      procUnit(output, { module: name, groups: [], expts }, item);
    }
  }
  return output;
};

function procGroup(output, ctx, group) {
  if (group.exports) {
    ctx.expts = ctx.expts.enter(group.exports);
  }
  if (Array.isArray(group.units)) {
    group.units.forEach(function(item, index) {
      procUnit(output, Object.assign({ firstChild: index === 0 }, ctx), item);
    });
  }
}

function procUnit(output, ctx, unit) {
  unit.ctx = ctx;
  unit.index = output.length;
  unit.metadata = unit.metadata || {};
  if (!_.isString(unit.name)) {
    unit.name = getUnitName(unit);
  }
  unit = ctx.expts.apply(unit);
  if (utils.type(unit.req) !== 'object') {
    throw new Error(`module must have property req with object type, wrong module "${unit.describe}"`);
  }
  if (!_.isUndefined(unit.res) && utils.type(unit.res) !== 'object') {
    throw new Error(`module must have property res with object type if exists, wrong module "${unit.describe}"`);
  }
  output.push(unit);
}

function getUnitName(unit) {
  return utils.md5x(unit.index + unit.describe, 8);
}
