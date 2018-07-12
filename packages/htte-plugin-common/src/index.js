module.exports = function(options) {
  return [
    require('./!@and')(options),
    require('./!@array')(options),
    require('./!@exist')(options),
    require('./!@object')(options),
    require('./!@or')(options),
    require('./!@query')(options),
    require('./!@regexp')(options),
    require('./!$concat')(options),
    require('./!$datetime')(options),
    require('./!$jsonarray')(options),
    require('./!$jsonobject')(options),
    require('./!$query')(options),
    require('./!$randstr')(options)
  ];
};
