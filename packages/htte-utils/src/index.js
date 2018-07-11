exports.templateString = function(templateString, templateVariables) {
	const keys = Object.keys(templateVariables);
	const values = Object.values(templateVariables);
	let templateFunction = new Function(...keys, `return \`${templateString}\`;`);
	return templateFunction(...values);
};

exports.type = function(value) {
  let type = typeof value;
  if (type !== 'object') return type;
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return 'object';
};