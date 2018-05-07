module.exports = {
  differ: [
    require('./differ/and'),
    require('./differ/array'),
    require('./differ/exist'),
    require('./differ/object'),
    require('./differ/or'),
    require('./differ/query'),
    require('./differ/regexp')
  ],
  resolver: [
    require('./resolver/concat'),
    require('./resolver/datetime'),
    require('./resolver/query'),
    require('./resolver/randstr')
  ]
}
