const _ = require("lodash");
const crypto = require("crypto");

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
  unit.name = getUnitName(unit);
  ctx.expts.apply(unit);
  return unit;
}

function getUnitName(unit) {
  if (unit.name) return unit.name;
  return hash(unit.index + unit.unit, 8);
}

function hash(str, size) {
  let origin = '0123456789abcdefghijklmnopqrstuvwxyz';
  let expect = 'abcdefghijklmnopqrstuvwxyz';
  return crypto
    .createHash("md5")
    .update(str)
    .digest("hex")
    .split("")
    .slice(0, size)
    .map(c => {
      return expect[origin.indexOf(c) % expect.length];
    })
    .join("");
}
