const diff = require('htte-diff');
const query = require('htte-query');
const { ContextError } = require('htte-errors');
const Resolver = require('./resolver');

function Differ(store, unit, parts = []) {
  this.store = store;
  this.unit = unit;
  this.parts = parts;
}

Differ.prototype.exec = function(handler, literal, actual) {
  let resolver = this.toResolver();
  literal = resolver.resolve(literal);
  return handler(this, literal, actual);
};

Differ.prototype.enter = function(seg) {
  return new Differ(this.store, this.unit, this.parts.concat(seg));
};

Differ.prototype.diff = function(expected, actual, strict) {
  diff(this, expected, actual, strict);
};

Differ.prototype.query = function(path) {
  return query(this.store, this.unit)(path);
};

Differ.prototype.throw = function(msg) {
  throw new ContextError(msg, this.parts);
};

Differ.prototype.toResolver = function() {
  return new Resolver(this.store, this.unit, this.parts);
};

module.exports = Differ;
