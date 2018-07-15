const Ajv = require('ajv');

schemas = ['config', 'patch', 'module', 'defines'];

const ajv = new Ajv({
  schemas: schemas.map(function(name) {
    return require(`./${name}.schema.json`);
  })
});

var validate = ajv.getSchema('http://example.com/schemas/schema.json');

schemas.forEach(name => {
  exports[name] = ajv.getSchema(`http://example.com/${name}.json`);
});
