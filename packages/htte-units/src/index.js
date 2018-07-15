const load = require('./load');
const createSchema = require('./create-schema');
const parse = require('./parse');
const Definition = require('./definition');
const _ = require('lodash');

module.exports = function({ config, plugins }) {
  let schema = createSchema(plugins);
  let modules = load(config, schema);
  let def = new Definition(config.defines || {});
  let units = _.flatMap(
    Object.keys(modules).map(function(key) {
      return parse(key, modules[key], def);
    })
  );
  return units;
};
