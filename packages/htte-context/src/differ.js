const diff = require('htte-diff');
const query = require('htte-query');
const { ContextError } = require('htte-errors');

function Differ(store, unit, segs = []) {
  this.store = store;
  this.unit = unit;
  this.segs = segs;
}

Differ.prototype.exec = function(tagType, handler, literal, actual) {
  if (tagType !== 'differ') {
    this.throw('resolver plugin is forbidden in differ context');
  }
  return handler(this, literal, actual);
};

Differ.prototype.enter = function(seg) {
  return new Differ(this.store, this.unit, this.segs.concat(seg));
};

Differ.prototype.diff = function(expected, actual, strict) {
  diff(this, expected, actual, strict);
};

Differ.prototype.query = function(path) {
  return query(this.store, this.unit)(path);
};

Differ.prototype.throw = function(msg) {
  throw new ContextError(msg, this.segs);
};

module.exports = Differ;
