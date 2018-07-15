module.exports = function(htte, options = {}) {
  let opts = {};
  return [
    require('./differs/and')(opts),
    require('./differs/array')(opts),
    require('./differs/exist')(opts),
    require('./differs/gt')(opts),
    require('./differs/gte')(opts),
    require('./differs/lt')(opts),
    require('./differs/lte')(opts),
    require('./differs/object')(opts),
    require('./differs/or')(opts),
    require('./differs/query')(opts),
    require('./differs/regexp')(opts),
    require('./differs/range')(opts),

    require('./resolvers/concat')(opts),
    require('./resolvers/jsonarray')(opts),
    require('./resolvers/jsonobject')(opts),
    require('./resolvers/query')(opts),
    require('./resolvers/randfloat')(opts),
    require('./resolvers/randint')(opts),
    require('./resolvers/randstr')(opts),
    require('./resolvers/time')(opts),
    require('./resolvers/tointeger')(opts),
    require('./resolvers/tonumber')(opts),
    require('./resolvers/tostring')(opts)
  ];
};
