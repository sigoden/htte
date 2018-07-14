const _ = require('lodash');
const utils = require('htte-utils');
const { ModuleError } = require('htte-errors');

module.exports = function(name, units, expts) {
  if (!_.isArray(units)) {
    throw new ModuleError(`must be array`, [name]);
  }
  let output = [];
  procNode(output, { module: name, groups: false, expts }, { units, describe: name });
  return output;
};

function procNode(output, ctx, node) {
  if (!_.isString(node.describe)) {
    throw new ModuleError(`must have property "describe"`, ctx.module, ctx.groups.concat('?'));
  }
  if (node.units) {
    if (!_.isArray(node.units)) {
      throw new ModuleError(`must have property "units" in array`, ctx.module, ctx.groups.concat(node.describe));
    }
    if (node.exports) {
      ctx.expts = ctx.expts.enter(node.exports);
    }
    node.units.forEach(function(child, index) {
      let localCtx = _.pick(ctx, ['module', 'groups', 'expts']);
      if (!ctx.groups) {
        localCtx.groups = []; // top level
      } else {
        localCtx.groups = ctx.groups.concat(node.describe);
      }
      localCtx.firstChild = index === 0;
      procNode(output, localCtx, child);
    });
    return;
  }
  procUnit(output, ctx, node);
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
    throw new ModuleError(`unit must have property req with object type`, ctx.module, ctx.groups.concat(unit.describe));
  }
  if (!_.isUndefined(unit.res) && utils.type(unit.res) !== 'object') {
    throw new ModuleError(
      `unit must have property res with object type if exists`,
      ctx.module,
      ctx.groups.concat(unit.describe)
    );
  }
  output.push(unit);
}

function getUnitName(unit) {
  return utils.md5x(unit.index + unit.describe, 8);
}
