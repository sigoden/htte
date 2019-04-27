const vm = require('vm');
const { getClass, beautifyVmError } = require('../helper');

module.exports = function(options) {
  return {
    name: 'eval',
    kind: 'mapping',
    diff: function(context, literal, actual) {
      if (literal === null) context.throw('literal cannot be null');
      let { js, args = {} } = literal;
      if (typeof js !== 'string') {
        return context.throw('literal must be { js, args? }');
      }
      if (args === null) {
        args = {};
      }
      if (getClass(args) !== 'Object') {
        return context.throw('literal.args must be object');
      }
      args.$ = true;
      args._ = actual;
      const vmContext = vm.createContext(args);
      const script = new vm.Script(js);
      try {
        script.runInContext(vmContext);
      } catch (err) {
        return context.throw('literal.js failed, ' + beautifyVmError(err));
      }
      console.log(args);
      if (!args.$) {
        return context.throw(`eval false`);
      }
      return true;
    }
  };
};
