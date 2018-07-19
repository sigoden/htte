module.exports = function init(htte, options = {}) {
  return function({ req }) {
    return Promise.resolve(req);
  };
};
