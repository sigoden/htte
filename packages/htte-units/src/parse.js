const _ = require('lodash');
const utils = require('htte-utils');

module.exports = function(name, units, macro) {
  let output = [];
  parseNode(output, { module: name, groups: false, macro }, { units, describe: name });
  return output;
};

function parseNode(output, ctx, node) {
  if (node.units) {
    if (node.defines) {
      ctx.macro = ctx.macro.scope(node.defines);
    }
    node.units.forEach(function(child, index) {
      let localCtx = _.pick(ctx, ['module', 'groups', 'macro', 'enterGroupLevel']);
      localCtx.firstChild = index === 0;
      if (!ctx.groups) {
        localCtx.groups = []; // top level
        localCtx.enterGroupLevel = 0;
      } else {
        localCtx.groups = ctx.groups.concat(node.describe);
        if (localCtx.firstChild) {
          localCtx.enterGroupLevel += 1;
        }
      }
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
  ctx.macro.resolve(unit);
  if (!unit.req) unit.req = {};
  if (!unit.res) unit.res = {};
  unit.session = {};
  output.push(unit);
}

function getUnitName(unit) {
  return utils.md5x(unit.index + unit.describe, 8);
}
