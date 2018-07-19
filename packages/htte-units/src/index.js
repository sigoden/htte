const load = require('./load');
const createSchema = require('./schema');
const parse = require('./parse');
const Macro = require('./macro');
const _ = require('lodash');

module.exports = function({ config, plugins }) {
  let schema = createSchema(plugins);
  let modules = load(config, schema);
  let macro = new Macro(config.defines || {});
  let units = _.flatMap(
    Object.keys(modules).map(function(key) {
      return parse(key, modules[key], macro);
    })
  );
  return units;
};
