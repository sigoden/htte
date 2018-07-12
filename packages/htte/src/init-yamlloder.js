const yaml = require('js-yaml');

const TAG_TYPES = {
  UNKNOWN: 'unknown',
  RESOLVER: 'resolver',
  DIFFER: 'differ'
};

module.exports = function(yamlTags) {
  let yamlTypes = yamlTags.map(tagToType);
  let schema = new yaml.Schema({
    include: [yaml.DEFAULT_SAFE_SCHEMA],
    explicit: yamlTypes
  });
  return function(file) {
    let content = fs.readFileSync(file, 'utf8');
    return yaml.load(content, { schema });
  };
};

function tagToType(yamlTag) {
  let { tag, kind, handler } = yamlTag;
  let tagType = getTagType(tag);
  if (tagToType === TAG_TYPES.UNKNOWN) {
    throw new Error(`plugin ${tag} type is invalid`);
  }
  return new yaml.Type(tag, { kind, constructor: createTypeConstructor(tagType, handler) });
}

function getTagType(tag) {
  if (/^!@/.test(tag)) {
    return TAG_TYPES.DIFFER;
  } else if (/^!\$/.test(tag)) {
    return TAG_TYPES.RESOLVER;
  } else {
    return TAG_TYPES.UNKNOWN;
  }
}

function createTypeConstructor(tagType, handler) {
  return function(literal) {
    return function(context, actual) {
      return context.exec(tagType, handler, literal, actual);
    };
  };
}
