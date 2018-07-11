const resolve = require("htte-resolve");
const query = require("htte-query");

function resolver(store, unit, segs = []) {
  let self = {segs: []};
  self.exec = function(tagType, handler, literal) {
    if (tagType !== 'resolver') {
      self.log('differ plugin is forbidden in resolver context');
      return;
    }
    let value = self.resolve(self, literal);
    return handler(self, value);
  }
  self.enter = function(seg) {
    return diff(store, unit, segs.concat(seg));
  };
  self.resolve = function(value) {
    return resolve(self, value);
  };
  self.query = query(store, unit);
  self.log = function(msg) {
    throw new Error(`${segs.join('⊳')} ${msg}`);
  };
  return self;
}

module.exports = resolver;