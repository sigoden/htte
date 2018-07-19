const fs = require('fs');
const _ = require('lodash');

module.exports = function(file) {
  let session = {};
  return {
    set: function(path, value) {
      _.set(session, path, value);
    },
    get: function(path) {
      return _.get(session, path);
    },
    load: function() {
      try {
        let content = fs.readFileSync(file, 'utf8');
        session = JSON.parse(content);
      } catch (err) {
        session = {};
      }
      return session;
    },
    save: function() {
      let content = JSON.stringify(session, null, 2);
      try {
        fs.writeFileSync(file, content, 'utf8');
      } catch (err) {
        throw new Error(`cannot write session to ${file}`);
      }
    }
  };
};
