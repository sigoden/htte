# Htte

[![Node Version](https://img.shields.io/badge/node-%3E=4-brightgreen.svg)](https://www.npmjs.com/package/htte)
[![Build Status](https://travis-ci.org/sigoden/htte.svg?branch=master)](https://travis-ci.org/sigoden/htte)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/f019843d36f643378a26840660c10f61)](https://www.codacy.com/app/sigoden/htte?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=sigoden/htte&amp;utm_campaign=Badge_Grade)
[![Coverage Status](https://coveralls.io/repos/github/sigoden/htte/badge.svg?branch=master)](https://coveralls.io/github/sigoden/htte?branch=master)
[![dependencies Status](https://david-dm.org/sigoden/htte/status.svg)](https://david-dm.org/sigoden/htte)
[![Known Vulnerabilities](https://snyk.io/test/github/sigoden/htte/badge.svg?targetFile=package.json)](https://snyk.io/test/github/sigoden/htte?targetFile=package.json)

Htte is a declartive HTTP API automated testing framework.

> Translation: [Englist](./README.md) | [中文](./README.zh.md)

## Features

- Write test using YAML
- No coupling with backend code
- Testing simplified to describe requests and responses
- Provide plugin to customize request data generation and response data assertion
- Provide data links to access other test data
- API coding configurable, builtin json(application/json)

## Getting started

### Instatll

Htte is a also command line application written in Javascript. Make sure [Node.js](https://nodejs.org/en/) works. Run the commands `node --version` and `npm --version` to check.

Install htte with npm

```
npm install -g htte
htte --version
```

### Usage

Assuming there is such an api endpoint:

```
Function: User login
URL: localhost:3000/login
Method: POST
Request Headers: { "Content-Type": "application/json" }
Request Body: {"username": "john", "password": "johnsblog"}
Response:
  - Condition: The username and password are correct
    Status Code： 200
    Body: {"username": "john", "token": "..."}
  - Condition: Incorrect username or password
    Status Code： 401
    Body: {"errcode": 11001, "message": "invalid username or password"}
```

How do we test the endpoint with htte?

### Config

We need to tell htte the defination of the endpoint。Add the api information in configuration file `htte.yaml`

```yaml
url: http://localhost:3000
type: json
apis:
  login:
    method: post
    uri: /login
```

### Write test

There are two situations. When the username and password are correct, the login token is returned. If there are not correct, an error message is returned.
We need to test these two situations. Write test into file `login.yaml`

```yaml
units:
  - describe: Login failed
    api: login
    req:
      body:
        username: john
        password: johnblog
    res:
      status: 401
      body:
        errcode: 11001
        message: !@exist
  - describe: login successful
    api: login
    name: johnLogin
    req:
      body:
        username: john
        password: johnsblog
    res:
      body:
        username: john
        token: !@exist
```

### Run test

Make sure API is available

Run the command
```
$ htte
```
Htte will read the configuration file `htte.yaml` and the test file `login.yaml` to get a series of test units and execute the test units one by one.

For each test unit, Htte will generate a request based on the `req` description and send it to the corresponding api endpoint, and then compare the response with the `res` description.

## Examples

- [Restful-Booker](./examples/restful-booker) — An API playground created by Mark Winteringham for those wanting to learn more about API testing and tools
- [Realword](./examples/realworld/) — Exemplary fullstack blog apps powered by React, Angular, Node, Django, and many more — it’s like TodoMVC, but for fullstack apps! 

## License

[MIT](https://github.com/sigoden/htte/blob/master/LICENSE)
