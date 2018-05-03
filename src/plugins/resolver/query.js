/**
 * Get the linked data
 *
 * e.g.
 *
 * !$query $auth.login.res.body.token
 * !$query $$login.res.body.token
 * !$query $$$res.body.token
 * !$query $$$$token
 */
module.exports = {
  name: 'query',
  kind: 'scalar',
  handler: (context, literal) => {
    let value = context.query(literal)
    if (value === undefined) {
      return context.error(`cannot find linked data at ${literal}`)
    }
    return value
  }
}
