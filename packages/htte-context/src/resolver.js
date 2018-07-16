const resolve = require('htte-resolve');
const query = require('htte-query');

const { ContextError } = require('htte-errors');

function Resolver(store, unit, segs = []) {
  this.store = store;
  this.unit = unit;
  this.segs = segs;
}

Resolver.prototype.exec = function(handler, literal) {
  if (handler.type !== 'resolver') {
    this.throw('expect resolver plugin instead of differ plugin');
  }
  literal = this.resolve(literal);
  return handler(this, literal);
};
Resolver.prototype.enter = function(seg) {
  return new Resolver(this.store, this.unit, this.segs.concat(seg));
};
Resolver.prototype.resolve = function(value) {
  return resolve(this, value);
};
Resolver.prototype.query = function(path) {
  return query(this.store, this.unit)(path);
};

Resolver.prototype.throw = function(msg) {
  throw new ContextError(msg, this.segs);
};

module.exports = Resolver;
