const crypto = require("crypto");

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

exports.trimYamlExt = function(file) {
  if (/\.yaml$/.test(file)) {
    return file.slice(0, -5);
  } else if (/\.yml$/.test(file)) {
    return file.slice(0, -4);
  }
  return file;
}

exports.nameFromPath = function(path) {
  return path.split('').filter(function (c) {
    let code = c.codePointAt();
    if (code >= 48 && code < 58) return true;
    if (code >= 65 && code < 91) return true;
    if (code >= 97 && code < 123) return true;
    if (code >= 128) return true;
    return false;
  }).join('');
}

exports.md5x = function(str, size) {
  let origin = '0123456789abcdefghijklmnopqrstuvwxyz';
  let expect = 'abcdefghijklmnopqrstuvwxyz';
  return crypto
    .createHash("md5")
    .update(str)
    .digest("hex")
    .split("")
    .slice(0, size)
    .map(function(c) {
      return expect[origin.indexOf(c) % expect.length];
    })
    .join("");
}