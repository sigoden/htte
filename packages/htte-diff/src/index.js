const _ = require("lodash");
const utils = require("htte-utils");

module.exports = function(context, expected, actual, strict = true) {
  switch (utils.type(expected)) {
    case "number":
    case "boolean":
    case "string":
    case "null":
    case "undefined":
      return diffPrimitive(context, expected, actual);
    case "function":
      try {
        return expected(context, actual);
      } catch (err) {
        return context.log(`cannot diff, ${err.stack}`);
      }
    case "array":
      return diffArray(context, expected, actual, strict);
    default:
      return diffObject(context, expected, actual, strict);
  }
};

/**
 * Diff the expected and the actual when the expected is primitive
 */
function diffPrimitive(context, expected, actual) {
  if (_.isEqual(expected, actual)) return true;
  return context.log(
    `value diff, ${JSON.stringify(expected)} ≠ ${JSON.stringify(actual)}`
  );
}

/*
 * Diff the expected and the actual when the expected is primitive
 */
function diffArray(context, expected, actual, strict) {
  if (!diffType(context, expected, actual)) return false;
  let sameLength = expected.length === actual.length;
  if (strict && !sameLength) {
    return context.log(`size diff, ${expected.length} ≠ ${actual.length}`);
  }
  return expected.every((elem, index) => {
    return diff(context.enter(`[${index}]`), elem, actual[index]);
  });
}

function diffType(context, expected, actual) {
  if (utils.type(expected) === utils.type(actual)) return true;

  return context.log(
    `type diff, ${utils.type(expected)} ≠ ${utils.type(actual)}`
  );
}

/*
 * Diff the expected and the actual when the expected is object
 */
function diffObject(context, expected, actual, strict) {
  if (!diffType(context, expected, actual)) {
    return false;
  }
  let expectedKeys = Object.keys(expected);
  let actualKeys = Object.keys(actual);

  if (strict && !satifyObjectKeys(context, expectedKeys, actualKeys)) {
    return false;
  }

  return expectedKeys.every(key => {
    let _expected = expected[key];
    let _actual = actual[key];
    return diff(context.enter(key), _expected, _actual);
  });
}

/**
 * Wheter the expected and the actual have same properties
 */
function satifyObjectKeys(context, expected, actual) {
  let excludes = _.difference(expected, actual);
  let includes = _.difference(actual, expected);

  let errMsg = ``;
  if (excludes.length) {
    errMsg += `, ++ ${excludes.join("|")}`;
  }
  if (includes.length) {
    errMsg += `, -- ${includes.join("|")}`;
  }

  if (!errMsg) {
    return true;
  }
  return context.log(`props diff` + errMsg);
}