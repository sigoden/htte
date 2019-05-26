module.exports = function(htte, opts = {}) {
  return [
    require('./differs/and')(opts),
    require('./differs/array')(opts),
    require('./differs/arraylike')(opts),
    require('./differs/compare')(opts),
    require('./differs/eval')(opts),
    require('./differs/exist')(opts),
    require('./differs/object')(opts),
    require('./differs/or')(opts),
    require('./differs/query')(opts),
    require('./differs/regexp')(opts),
    require('./differs/trycatch')(opts),

    require('./resolvers/concat')(opts),
    require('./resolvers/convert')(opts),
    require('./resolvers/eval')(opts),
    require('./resolvers/mock')(opts),
    require('./resolvers/query')(opts),
    require('./resolvers/randstr')(opts)
  ];
};
