/**
 * Array differ asserts the target is array, and specific elements match
 *
 * The parameters could be the index of array, check the element at the index.
 * the parameters could be length, check the length of array.
 *
 * e.g.
 *
 * value: !@array
 *  0: a
 *
 * [] ✗
 * ['a'] ✓
 * ['a', 'b'] ✓
 *
 * value: !@array
 *  1: b
 *  length: 2
 *
 * ['a', 'b'] ✓
 * ['a', 'b', 'c'] ✗
 *
 * value: !@array
 *  0: a
 *  1: b
 *  2: c
 *
 * ['a', 'b', 'c'] ✓
 * ['a', 'b', 'c', 'd'] ✓
 * ['a', 'c'] ✗
 */

module.exports = {
  name: 'array',
  kind: 'mapping',
  handler: (context, literal, actual) => {
    if (!Array.isArray(actual)) {
      return context.error('target must be array')
    }
    if (literal === null) return true
    let object = { length: actual.length }
    actual.forEach((elem, index) => {
      object[index] = elem
    })
    return context.diff(context, literal, object, false)
  }
}
