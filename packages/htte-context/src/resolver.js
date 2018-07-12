const resolve = require('htte-resolve');
const query = require('htte-query');

const { ContextError } = require('htte-errors');

function resolver(store, unit, segs = []) {
  let self = { segs: [] };
  self.exec = function(tagType, handler, literal) {
    if (tagType !== 'resolver') {
      self.throw('differ plugin is forbidden in resolver context');
    }
    let value = self.resolve(literal);
    return handler(self, value);
  };
  self.enter = function(seg) {
    return resolver(store, unit, segs.concat(seg));
  };
  self.resolve = function(value) {
    return resolve(self, value);
  };
  self.query = query(store, unit);
  self.throw = function(msg) {
    throw new ContextError(msg, segs, self.throw);
  };
  return self;
}

module.exports = resolver;
