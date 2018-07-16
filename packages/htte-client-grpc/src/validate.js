const Ajv = require('ajv');
const ajv = new Ajv();

const schema = require('./options.schema.json');

module.exports = ajv.compile(schema);
