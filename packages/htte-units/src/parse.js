const _ = require('lodash');
const utils = require('htte-utils');

module.exports = function(name, units, def) {
  let output = [];
  parseNode(output, { module: name, groups: false, def }, { units, describe: name });
  return output;
};

function parseNode(output, ctx, node) {
  if (node.units) {
    if (node.defines) {
      ctx.def = ctx.def.scope(node.defines);
    }
    node.units.forEach(function(child, index) {
      let localCtx = _.pick(ctx, ['module', 'groups', 'def']);
      if (!ctx.groups) {
        localCtx.groups = []; // top level
      } else {
        localCtx.groups = ctx.groups.concat(node.describe);
      }
      localCtx.firstChild = index === 0;
      parseNode(output, localCtx, child);
    });
    return;
  }
  parseUnit(output, ctx, node);
}

function parseUnit(output, ctx, unit) {
  unit.ctx = ctx;
  unit.index = output.length;
  unit.metadata = unit.metadata || {};
  if (!_.isString(unit.name)) {
    unit.name = getUnitName(unit);
  }
  ctx.def.resolve(unit);
  if (!unit.req) unit.req = {};
  if (!unit.res) unit.res = {};
  output.push(unit);
}

function getUnitName(unit) {
  return utils.md5x(unit.index + unit.describe, 8);
}
