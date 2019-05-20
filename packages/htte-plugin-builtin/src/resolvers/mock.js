const Mock = require('mockjs');

module.exports = function(options) {
  return {
    name: 'mock',
    kind: 'scalar',
    resolve: function(context, literal) {
      return Mock.mock(literal);
    }
  };
};
