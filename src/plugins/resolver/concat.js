/**
 * Concat elements
 *
 * e.g.
 *
 * !$concat [a, b, c]
 * 'abc'
 *
 * !$concat [a, ' ', c]
 * 'a c'
 *
 * !$concat [Bearer, ' ', !$query $auth.login.req.body.token]
 * 'Bearer <token>'
 */
module.exports = {
  name: 'concat',
  kind: 'sequence',
  handler: (context, literal) => {
    if (!Array.isArray(literal)) {
      return context.error('arguments must be array')
    }
    return literal.join('')
  }
}
