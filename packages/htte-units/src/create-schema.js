const yaml = require('js-yaml');

module.exports = function(plugins) {
  let yamlTypes = [];
  for (let ns in plugins) {
    let group = plugins[ns];
    for (let type of group) {
      if (ns) type.name = ns + '/' + type.name;
      yamlTypes.push(typeToYamlType(type));
    }
  }
  return new yaml.Schema({
    include: [yaml.DEFAULT_SAFE_SCHEMA],
    explicit: yamlTypes
  });
};

function typeToYamlType(type) {
  if (type.resolve) {
    return new yaml.Type(`!$${type.name}`, {
      kind: type.kind,
      construct: createTypeConstructor('resolver', type.resolve)
    });
  } else if (type.diff) {
    return new yaml.Type(`!@${type.name}`, {
      kind: type.kind,
      construct: createTypeConstructor('differ', type.diff)
    });
  }
}

function createTypeConstructor(tagType, handler) {
  return function(literal) {
    return function(context, actual) {
      return context.exec(tagType, handler, literal, actual);
    };
  };
}
