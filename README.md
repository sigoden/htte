# Htte

[![Node Version](https://img.shields.io/badge/node-%3E=4-brightgreen.svg)](https://www.npmjs.com/package/htte)
[![Build Status](https://travis-ci.org/sigoden/htte.svg?branch=master)](https://travis-ci.org/sigoden/htte)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/f019843d36f643378a26840660c10f61)](https://www.codacy.com/app/sigoden/htte?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=sigoden/htte&amp;utm_campaign=Badge_Grade)
[![Coverage Status](https://coveralls.io/repos/github/sigoden/htte/badge.svg?branch=master)](https://coveralls.io/github/sigoden/htte?branch=master)
[![dependencies Status](https://david-dm.org/sigoden/htte/status.svg)](https://david-dm.org/sigoden/htte)
[![Known Vulnerabilities](https://snyk.io/test/github/sigoden/htte/badge.svg?targetFile=package.json)](https://snyk.io/test/github/sigoden/htte?targetFile=package.json)

Htte is a declartive http automation test framwork, write tests with YAML.

> Translations: [English](README.md) | [中文](README.zh.md)

When we develop web server, we need to test the endpoints. You can test manually with postman or curl, but it is urgly and tedious.
The clever programmers will write test suite to automate the task. The steps of testing api have pattern: first make an request, then send it through http protocol.
finally assert the response whether it is what we need.

We use the api of regist user and api of update user data to demo the tests.  The implementation in Node.js is:

```js
const { assert } = request('chai')

let registJohnToken

it('regist', function() {
  return request(app)
    .post('/api/users')
    .set('Accept', 'application/json')
    .send({
      user: {
        email: 'john@jacob.com',
        password: 'johnnyjacob',
        username: 'johnjacob'
      }
    })
    .expect(200)
    .then(response => {
      let user = response.body.user
      assert.isDefined(user)
      assert.equal(user.email, 'john@jacob.com')
      assert.equal(user.username, 'johnjacob')
      assert.isDefined(user.token)
      registJohnToken = user.token
    })
});

it('update user data', function () {
  return request(app)
    .put('/api/user')
    .set('Accept', 'application/json')
    .set('Authorization', 'Token ' + registJohnToken)
    .send({
      user: {
        username: 'john'
      }
    })
    .expect(200)
    .then(response => {
      let user = response.body.user
      assert.isDefined(user)
      assert.equal(user.username, 'john')
    })
})
```

How to use htte to test the two apis?

First we need a config file `.htte.yaml` which defines the endpoints of api.

```yaml
url: http://localhost:3000/api
apis:
  register: 
    method: post
    uri: /users
  updateUser:
    method: put
    uri: /user
```

Then we write the test code in file `user.yaml`.

```yaml
units:
  - describe: register user
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
          email: john@jacob.com
          username: johnjacob
          token: !@exist
  - describe: update user data
    api: updateUser
    req:
      headers:
        Authorization: !$concat ['Token', ' ', !$query $$registerJohn.res.body.user.token]
      body:
        user:
          username: john
    res:
      body:
        user: !@object
          username: john
```

Done the job.

We can execute the tests with htte cli.

```sh
$ htte # execute the tests, if htte cli could not be found，install it with `npm i -g htte`

RunUnits: 
  user:
    regist user:
      ✓
    update user data:
      ✓
```

> The api is part of [realworld](https://github.com/sigoden/node-express-realworld-example-app.git) project. The project use htte to test its endpoints, You can learn how to use htte from it.

## Features

- Use declartive language YAML to write tests.
- Decouple with backend language
- No requirement of programing skill.
- Test by describing the data made request and received from response, which is simple, easy to understand, easy to write.
- Use plugin to customize the data of request and the assertion of the response, which is flexiable and concise.
- Use jsonpath variable to decouple the data exchange of tests

## Content

- [Config](#config)
- [Code](#code)
    - [Dependencies](#dependencies)
    - [Units](#units)
    - [Unit](#unit)
- [Plugin](#plugin)
    - [Why need plugin](#why-need-plugin)
    - [How plugin works](#how-plugin-works)
    - [Kinds of plugin](#kinds-of-plugin)
    - [Builtin plugins](#builtin-plugins)
- [Variable](#variable)
    - [Why need variable](#why-need-variable)
    - [How to define variable](#how-to-define-variable)
    - [Variable convention](#variable-convention)
    - [Global variable](#global-variable)

## Config

To do the test, htte need to know where to load test files, what endpoints there are, where to send requests, what plugins need to be installed, etc.
Htte gets the infomation from yaml config file Whose path can be provided through cli options `-c` or `--config`.

Here is list of all the options and its explanation.

```yaml
rootDir: '.' # An directory contained test files. Htte load the yaml in that directory recursively, then parse the file as module.
sessionFile: ./.session # File to persist the session. Htte use session to record the request and response data of each test.
url: http://localhost:3000 # Base url of all the api. if the api use relative path, htte will get absolute path by prepend that url.
serializers: [] # List of npm modules, will regist serializers. Serializer set `Content-Type` header, encode the request body, and decode the response.
type: json # The default serializer, used when an api omits type.
timeout: 1000 # Specifies the number of milliseconds before the request times out.
apis: {} # Define endpoints.
variables: {} # Provides global variable.
plugins: [] # List of npm modules, will regist plugins
```

`apis` is required, and it is made up of a group of endpoints. Each endpoint conatins: name, uri(required), method(default `get`), type(of encoding), timeout.

it can be in the form of mapping:

```yaml
apis:
  register:
    method: post
    uri: /users
    type: 'json'
    timeout: 300
  getUser: /user
```

or in the form of sequence:

```yaml
apis:
  - name: register
    uri: /users
    method: post
    type: 'json'
    timeout: 300
  - name: getUser
    uri: /user
```

## Code

Put all the codes in one file is not a good practice. Htte enable split the codes into multiple files.

Each single file is respect as a test module.

Each module could have two parts: `dependencies` and `units`.

### Dependencies

`dependencies` guarantee the order of tests.

The tests should be runned in order. A user can not publish an article before registration. Htte load all the files in the `rootDir` as modules, These modules are sorted on the file path first, then thery are sorted by the dependency relationship.

Considerd there is a `auth` module contains the tests about registration and logining, a `article` module contains the tests of CRUD about the article. it is obvious that `auth` module should be runned before `article` module. Adding `auth` module to the dependencies of `article` module guarantees the order. 

The `dependencies` is consisted of dependence. Each dependence have properties: module(file path relative to the dependent module), name. Htte use the path to generate name when name is ommited.

`dependencies` could be in the form of mapping:

```yaml
dependencies:
  - ./auth.yaml
  - name: article
    module: ./article-authenticated.yaml
```

or in the form of sequence:

```yaml
dependencies:
  auth: ./auth.yaml
  article: ./article-authenticated.yaml
```

There are some notes about dependence:

- Htte will trigger error when it detects circlic-dependence.
- Dependence impact on variable, once a module included the other modules in the `dependencies`, the tests in that module can use the variable from its dependencies modules.

### Units

Units may have child test-unit or child units.

```yaml
units:
  - describe: feed
    api: getFeed
    req:
      headers:
        Authorization: !$concat ['Token', ' ', !$query $auth.loginJohn.res.body.user.token]
    res:
      body:
        articles: []
        articlesCount: 0
  - describe: article without auth
    units:
      - describe: all articles
        api: listArticles
```

The top-level `units` have `feed` unit and `article without auth` units. the child units `article without auth` also have child unit `all articles`. units can have any amounts and any level of unit or units.

### Unit

test-unit describe how htte make request and how to verify response.

A example of unit:

```yaml
describe: test an api # description of test, required
api: endpoint # endpoint of test, point to the `apis` option of config, required
name: test-endpoint
req: # request
  params: { slug: 'htte', id: 3 } # params of url
  headers: { Authorization: 'Bearer ...'} # http headers of request
  query:  { page: 3, size: 20 }  # querystring of url
  body: { content: 'go! go! go!' } # body of request
res: # response 
  status:  200 # status code, if the field is omit, htte will l assert the status code between 200 and 299
  headers: { Content-Length: '26' } # http headers of response
  body: !@object { json: { content: 'go! go! go!' } } # body of response
```

if the endpoint is:

```
method: post
name: endpoint
uri: https://httpbin.org/anything/{slug}/{id}
```

htte will make request as:
```
curl \
   -X POST \
   -H 'Content-Type: application/json' \
   -H 'Authorization: Bearer ...' \
   -d '{"content": "go! go! go!"}' \
   https://httpbin.org/anything/htte/id
```

Then htte will do assertions:
- status code is 200
- the response header have field `content-length`, whose value is 26
- the response body is an object, it has a property json, whose value is also an object `{content: 'go! go! go!'}`

All rules psss, then the test pass, any rule fail, the test will fail.

Some notes:
- Only `describe` and `api` is required
- `res.params` must match the params of url path. if pathname is  `/articles/{slug}/comments/{id}`, `req.params` must have properties slug and id
- Other tests use the `name` to reference the data of test.

## Plugin

### Why need plugin

To test endpoint, we need to make request, and diff the response with what we expect. 
Sometimes we cannot write down the value directlly. What's the value of current time? How you respent string with random suffix? We may use symbol to respent the time, but there are many sitution and we need so many symbols. Using symbol is not pratical.

We need function, only function can cover all the sitution.

Plugin provide function, so we need plugin.

### How plugin works

Htte use yaml to describe the test. To understand how plugin works, we need to understand yaml specification first.

YAML have 4 data types.

- scalar
- sequence
- mapping
- tag

```yaml
scalar: 3 

sequence1: 
  - 1
  - 2
sequence2: [1, 2]

mapping1:
  country: china
  captial: beijing
mapping2: { country: china, captial: beijing }

tag: !$now 86400000
```

We focus on tag. Tag need to be registed before one can use. We need to pass these parameters to yaml parser: tag name, parameter type, construt function. When the parser comes to the tag, it will pick up the data after the tag and pass the data to construt function, it use the returned value of the function as tag data value.

We regist a plugin, it's same as we regist a yaml tag. the plugin is executed when the parser call the tag construt function.

### Kinds of plugin

There have two kinds of plugin: 

- resolver
  used to make the request, its raml tag have an prefix `!$`, for example `!$now` return current time string.

- differ
  used to diff the response, its raml tag have an prefix `!@`, for example `!@regexp` test the value with regexp.

### Builtin plugins

Htte has some builtin plugins. These plugins are registed already. They provide basic and useful function. 

#### !$query
`!$query`: query a variable, parameter type is scalar

```yaml
!$query $auth.login.req.body.user.token # will return the value of token of user of response data of test named login in the auth module
```

#### !$concat
`!$concat`: concat list of string, parameter type is sequence

```yaml
!$concat: [a, b, c] # "abc"
!$concat: [Bearer, ' ', !$query $auth.login.req.body.user.token] # "Bearer <token value>", the element of sequence may have other resolver
```

#### !$now
`!$now`: the string of current time, parameter type is scalar

it take one argument named offset which means the offset in milliseconds of current datetime.

```yaml
!$now # 2018-04-25T02:29:03.572Z, now
!$now 86400000 # 2018-04-26T02:29:03.572Z, tomorrow
!$now -86400000 # 2018-04-24T02:29:03.572Z, yesterday
```

#### !$randstr
`!randstr`:  random string, parameter type is scalar

it take on argument named length which is the length of generated random string.

```yaml
!$randstr # 5xa4Wi
!$randstr # Qdf4dY
!$randstr 8 # 9sw2DhxH
```

#### !@query
`!@query`: diff the value with the value of the variable, parameter type is scalar

```yaml
res:
  body:
    email: !@query $$$res.body.email
```
If the response of the test have eamil field and its value is same with the email property of request body, pass.

#### !@exist
`!@exist`: whether have the property，parameter type is scalar

```yaml
res:
  body:
    username: !@exist
    token: !@exist
```
If the response of the test have two fields username and token and dont have other properties, pass. 

#### !@regexp
`!@regexp`: Wheter match regexp，parameter type is scalar

```yaml
res:
  body:
    slug: !@regexp /^how-to-train-your-dragon-\\w{6}$/
```
If the response of the test have filed slug and lts value match the regexp, pass.


#### !@array
`!@array`: partial diff on array，parameter type is mapping

```yaml
res:
  body: !@array
    0: dragon
```
If the response is array and the first element of that array is `dragon`, pass.
it have only interest on first elemnt, ignore other parts.

It works on the length of array.

```yaml
res:
  body: !@array
    0: dragon
    length: 4
```

Htte will do full-equal compartion on array. Use the plugin to do partial diff.

#### !@object
`!@object`: partial diff on object, parameter type is mapping

```yaml
res:
  body: !@object
    email: john@jacob
```
If the resposne data have property email and its value is `john@jacob`, pass.
If ommited the `!@object`, htte will assert the response have only property email.

Htte wll do full-equal compartion on object. Any extra properties or miss properties will fail.

## Virable

Htte use the variable to access the data from other tests.

### Why need variable

Web server have state, the endpoints have connection. Use can publish article only when he/she regist an accout. The endpoint of publishing artitle need the token informaiton from the endpoint of registration

We need the way to access data of other tests. it is variable.

### How to define variable

When htte execute the unit, it will get the request and response data, it also persist the data in `sessionFile`.

For example, after executed the unit `registJohnToken` (see the begin), htte add a record:

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

- `auth` - the name of module
- `registJohnToken` - the name of unit
- `req` - the request data 
- `res` - the response data from web server

> You can use command `htte inspect` to get the detail

This is a huge object. We need a specifi value usally. like token or username. It's tedious to mark every value as variable. To point to the value. htte use [jsonpath](https://github.com/dchtteer/jsonpath). the path to access data is the variabl name. No need to declar variable or bind. Any part of data object can be regard as variable.

If we need the value of token. we find its jsonpath `auth.registerJohn.res.body.user.token`, we know its variable `$auth.registerJohn.res.body.user.token`, we get the value using yaml tag:  `!$query $auth.registerJohn.res.body.user.token`.

### Variable convention

Variable is based on jsonpath. it includes module name and test name, has prefix `$`.

When pointing the data in same module. the module name can be omitted, like `$$registerJohn.res.body.user.token`, just with prefix `$$`。

When pointing the data in same unit, the unit name can be ommitted, like `$$$req.body.user.email`, prefix `$$$`.

### Global variable

Global variable comes from the `variables` options of config. It works like normal variale, but with prefix `$$$$`.

## License

[MIT](https://github.com/sigoden/htte/blob/master/LICENSE)
