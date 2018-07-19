module.exports = function(htte, options = {}) {
  return [{ name: 'fake', kind: 'scalar', diff: () => {} }];
};
