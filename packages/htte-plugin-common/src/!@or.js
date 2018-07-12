const os = require('os');

module.exports = function(options) {
  return {
    tag: '!@or',
    kind: 'sequence',
    handler: function(context, literal, actual) {
      if (!Array.isArray(literal)) {
        context.throw('yaml tag arguments must be array');
      }
      let errors = [];
      for (let item of literal) {
        try {
          context.diff(item, actual);
          return;
        } catch (err) {
          errors.push(err.segs.join('.') + ': ' + err.message);
        }
      }
      context.throw(errorss.join(os.EOL));
    }
  };
};
