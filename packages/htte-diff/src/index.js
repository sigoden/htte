const _ = require('lodash');
const utils = require('htte-utils');

module.exports = function(context, expected, actual, strict = true) {
  switch (utils.type(expected)) {
    case 'number':
    case 'boolean':
    case 'string':
    case 'null':
    case 'undefined':
      diffPrimitive(context, expected, actual);
    case 'function':
      try {
        expected(context, actual);
      } catch (err) {
        context.throw(`cannot diff, ${err.message}`);
      }
    case 'array':
      diffArray(context, expected, actual, strict);
    default:
      diffObject(context, expected, actual, strict);
  }
};

/**
 * Diff the expected and the actual when the expected is primitive
 */
function diffPrimitive(context, expected, actual) {
  if (_.isEqual(expected, actual)) return;
  context.throw(`value diff, ${JSON.stringify(expected)} ≠ ${JSON.stringify(actual)}`);
}

/*
 * Diff the expected and the actual when the expected is primitive
 */
function diffArray(context, expected, actual, strict) {
  diffType(context, expected, actual);
  let sameLength = expected.length === actual.length;
  if (strict && !sameLength) {
    context.throw(`size diff, ${expected.length} ≠ ${actual.length}`);
  }
  expected.forEach(function(elem, index) {
    diff(context.enter(`[${index}]`), elem, actual[index]);
  });
}

function diffType(context, expected, actual) {
  if (utils.type(expected) === utils.type(actual)) return;
  context.throw(`type diff, ${utils.type(expected)} ≠ ${utils.type(actual)}`);
}

/*
 * Diff the expected and the actual when the expected is object
 */
function diffObject(context, expected, actual, strict) {
  diffType(context, expected, actual);
  let expectedKeys = Object.keys(expected);
  let actualKeys = Object.keys(actual);

  if (strict) {
    matchKeys(context, expectedKeys, actualKeys);
  }

  expectedKeys.forEach(function(key) {
    diff(context.enter(key), expected[key], actual[key]);
  });
}

/**
 * Wheter the expected and the actual have same properties
 */
function matchKeys(context, expected, actual) {
  let excludes = _.difference(expected, actual);
  let includes = _.difference(actual, expected);

  if (excludes.length === 0 && includes.length === 0) return;

  let errMsg = ``;
  if (excludes.length) {
    errMsg += `, ++ ${excludes.join('|')}`;
  }
  if (includes.length) {
    errMsg += `, -- ${includes.join('|')}`;
  }
  context.throw(`props diff` + errMsg);
}
