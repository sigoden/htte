/**
 * Query differ get and diff linked data
 *
 * e.g.
 *
 * value: !@query $auth.login.res.body.token
 * value: !@query $$login.res.body.token
 * value: !@query $$$res.body.token
 * value: !@query $$$$token
 */
module.exports = {
  name: 'query',
  kind: 'scalar',
  handler: (context, literal, actual) => {
    let value = context.query(literal)
    if (value === undefined) {
      return context.error(`cannot find linked data at ${literal}`)
    }
    return context.diff(context, value, actual)
  }
}
