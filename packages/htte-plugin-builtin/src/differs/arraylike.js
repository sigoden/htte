module.exports = function(options) {
  return {
    name: 'arraylike',
    kind: 'mapping',
    diff: function(context, literal, actual) {
      if (literal === null) context.throw('literal cannot be null');
      if (!Array.isArray(actual)) context.throw('actual must be array');
      let obj = { length: actual.length };
      if (literal['?']) {
        const some = literal['?'];
        delete literal['?'];
        let isPass = false;
        for (let item of actual) {
          try {
            context.diff(some, item);
            isPass = true;
            break;
          } catch (err) {}
        }
        if (!isPass) {
          context.throw('no element pass op ?');
        }
      }
      if (literal['*']) {
        const any = literal['*'];
        delete literal['*'];
        let index;
        try {
          actual.forEach(function(item, i) {
            index = i;
            context.diff(any, item);
          });
        } catch (err) {
          context.enter(index).throw(`fail op *`);
        }
      }
      actual.reduce(function(obj, item, index) {
        obj[index] = item;
        return obj;
      }, obj);
      context.diff(literal, obj, false);
    }
  };
};
