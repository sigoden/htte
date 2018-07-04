/**
 * JSON.strigify the mapping
 * @argument {object} data
 *
 * e.g.
 *
 * !$jsonobject { a: 3, b: 4 }
 * {"a":3,"b":4}
 */
module.exports = {
  name: 'jsonobject',
  kind: 'mapping',
  handler: (context, literal) => {
    return JSON.stringify(literal)
  }
}
