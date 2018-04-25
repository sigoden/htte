## variable

Htte use the variable to access the data of other tests.

### origin

If there is module `auth`, it have a test named `registerJohn`, lts yaml is:

```yaml
units:
  - describe: register
    api: register
    name: registerJohn
    req:
      body:
        user:
          email: john@jacob.com
          password: johnnyjacob
          username: johnjacob
    res:
      body:
        user:
          email: !@query $$$req.body.user.email
          username: !@query $$$req.body.user.username
          token: !@exist
```

After executed test, htte will record follow info:

```
{
 auth: {
  registerJohn: {
    req: {
      body: {
        user: {
          email: 'john@jacob.com',
          password: 'johnnyjacob'
          username: 'johnjacob'
        }
      }
    },
    res: {
      status: 200,
      headers: {
        Content-Type: 'application/json',
        ...
      },
      body: {
        user: {
          username: 'johnjacob'
          email: 'john@jacob.com'
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJqb2huamFjb2IiLCJleHAiOjE1Mjk4MjMyNDEsImlhdCI6MTUyNDYzOTI0MX0.hdzrrn1wk9M7ba1WBugoWjtp-suG1d4UVW0hhf-aD8E'
        }
      }
    }
  }
 } 
}
```

Any parts of that record can be variable.

### jsonpath

Htte use [jsonpath](https://github.com/dchtteer/jsonpath) to select the data.

The jsonpath of the token is `$.auth.registerJohn.res.body.user.token`, the variable to access that value is $auth.registerJohn.res.body.user.token

### type

- cross-module variable

Cross-module variable point to the data in other modules. The target module must be in the dependencies list. The variable start with `$`. e.g. `$auth.registerJohn.res.body.user.token`

- module variable

Module variable point to the data in same module. The target test must be in the front. The variable start with `$$`. e.g. `$$registerJohn.res.body.user.token`

- local variable

Local variable also means the variable from req point to the data in res in the same test-unit. The variable start with `$$$`. e.g. `$$$req.body.user.email`

- global variable

Global variable point to the data in `variables` of config. The variable start with `$$$$`.
