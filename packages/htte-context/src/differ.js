const diff = require('htte-diff');
const query = require('htte-query');

function differ(store, unit, segs = []) {
  let self = { segs: [] };
  self.exec = function(tagType, handler, literal, actual) {
    if (tagType !== 'differ') {
      self.log('resolver plugin is forbidden in differ context');
      return;
    }
    return handler(self, literal, actual);
  };
  self.enter = function(seg) {
    return diff(store, unit, segs.concat(seg));
  };
  self.diff = function(expected, actual, strict) {
    return diff(self, expected, actual, strict);
  };
  self.query = query(store, unit);
  self.log = function(msg) {
    throw new Error(`${segs.join('⊳')} ${msg}`);
  };
  return self;
}

module.exports = differ;
