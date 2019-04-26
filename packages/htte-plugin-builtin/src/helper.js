function getClass(obj) {
  if (typeof obj === 'undefined') {
    return 'undefined';
  }
  if (obj === null) {
    return 'null';
  }
  return Object.prototype.toString.call(obj).match(/^\[object\s(.*)\]$/)[1];
}

exports.getClass = getClass;

function beautifyVmError(err) {
  return err
    .split('\n')
    .slice(1, 3)
    .join('\n');
}

exports.beautifyVmError = beautifyVmError;
