# Hest

Hest is a declartive http test framwork.

> Languge [English](README.md) | [中文](README.zh.md)

## Features

- Declartive, hest do not couple with any backend language
- Plugin system, you can do any you like to generate or process request data, feel free to diff the response data
- Variables, hest record the request and reponse of tested endpoints, you can use it later. 

## Get start

install cli tool

```
npm i hest -g
```

create the project config file `.hest.yaml`
```
url: http://localhost:3000/api
apis:
  register: 
    method: post
    uri: /users
  updateUser:
    method: put
    uri: /user
```

create the tests `user.yaml`
```
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
          username: john         username: john
```

run the test

```
hest

RunUnits:
  user:
    register user:
      ok [278.416928ms]
    update user data:
      ok [143.124919ms]
```

> Only partial endpoints included, see the full version at [realworld](https://github.com/sigoden/node-express-realworld-example-app.git).

## how it work

Hest read the config file `.hest.yaml`, know that there are two units, `register user` and `update user data`.

Hest start excute the unit `register user`, it lookup the api on the config file to find the request path and http method.

Hest send the request to endpoint `register`, the request data is generated based on the req field.

```
url: http://localhost:3000/api/users
method: post
headers:
  Content-Type: application/json
body: |
  {
    "user": {
      "email": "john@jacob.com",
      "password": "johnnyjacob",
      "username": "johnjacob"
    }
  }
```

Then hest verify the reponse, it generates some assetion from the res field.

- response data must have user object
- user object have properties email, username and token; no more properties nor less.
- the value of eamil is john@jacob.com
- the value of username is johnjacob
- user have property token

any rule fails, the testing of the endpoint also fails.

`!@exist` is a yaml tag, it is an function that the plugin regists, it asset the property existed.

> Hest provide plugin system to enable the user customizing the way to verify the resposne data. there is a builtin plugin named `!@regexp` which verify the value matched the regexp.

Hest execute unit `update user` too, send the request.

```
url: http://localhost:3000/api/user
method: put
headers:
  Content-Type: application/json
  Authorization: Token <ref the token of the response of registerJohn>
body: |
  {
    "user": {
      "username": "john"
    }
  }
```

`!$query` is also a yaml tag and a function, it can query the variable。Hest record the all the request and response data as variable，the data is accesable through the `!$query` tag。

> Hest provide plugin system to enable the user customizing the way to generate the request data. there is a builtin plugin named `!$now` which returns the current time, a plugin named `!$randstr` which returns a random string

Hest also verify the resposne, it use the follow rules:

- response data have user object
- user have a property named username with value john

> The `!@object` is plugin to verify the value is object. if ommited, Hest will asset the user object have only one property. It enable the verification of the intreset properties other than all properties.

### Documentation

- [config](./docs/config.md)
- [module](./docs/module.md)
- [plugin](./docs/plugin.md)
- [variable](./docs/variable.md)

## LICENSE

[MIT](https://github.com/sigoden/hest/blob/master/LICENSE)
