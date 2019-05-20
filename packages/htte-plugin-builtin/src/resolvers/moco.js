const Mock = require('mockjs');

module.exports = function(options) {
  return {
    name: 'moco',
    kind: 'mapping',
    resolve: function(context, literal) {
      return Mock.mock(literal);
    }
  };
};
