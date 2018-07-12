const _ = require("lodash");
const utils = require('htte-utils');

module.exports = function(name, mod, expts) {
  if (_.isArray(mod)) {
    throw new Error(`module ${name} must be array`);
  }
  let output = [];
  for (let item of mod) {
    if (item.group) {
      procGroup(output, {module: name, groups: [item.group], expts}, item);
    } else if (item.unit) {
      procUnit(output, {module: name, groups: [], expts}, item);
    }
  }
  return output;
};

function procGroup(output, ctx, group) {
  ctx.expts = group.exports && expts.enter(group.exports);
  if (Array.isArray(group.units)) {
    group.units.forEach(function(item, index) {
      procUnit(output, Object.assign({firstChild: index === 0}, ctx), item);
    });
  }
}

function procUnit(output, ctx, unit) {
  unit.ctx = ctx;
  unit.index = output.length;
  unit.metadata = unit.metadata || {};
  unit.name = getUnitName(unit);
  return ctx.expts.apply(unit);
}

function getUnitName(unit) {
  if (unit.name) return unit.name;
  return utils.md5x(unit.index + unit.unit, 8);
}