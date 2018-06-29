# Htte - Declarative HTTP API automated testing tool.

[![Node Version](https://img.shields.io/badge/node-%3E=4-brightgreen.svg)](https://www.npmjs.com/package/htte)
[![Build Status](https://travis-ci.org/sigoden/htte.svg?branch=master)](https://travis-ci.org/sigoden/htte)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/f019843d36f643378a26840660c10f61)](https://www.codacy.com/app/sigoden/htte?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=sigoden/htte&amp;utm_campaign=Badge_Grade)
[![Coverage Status](https://coveralls.io/repos/github/sigoden/htte/badge.svg?branch=master)](https://coveralls.io/github/sigoden/htte?branch=master)
[![dependencies Status](https://david-dm.org/sigoden/htte/status.svg)](https://david-dm.org/sigoden/htte)
[![Known Vulnerabilities](https://snyk.io/test/github/sigoden/htte/badge.svg?targetFile=package.json)](https://snyk.io/test/github/sigoden/htte?targetFile=package.json)

> Translation: [English](./README.md) | [中文](./README.zh.md)

## Features

- Automation, excute test cases one by one
- Declarative, wrinting tests with YAML
- Language agnostic, platform agnostic
- Provide plugin to customize request data generation and response data assertion
- Pluggable serializers (JSON, XML)

## Getting started

API testing means making a request and check the resonse.

Make a request using cURL

```sh
curl -X PUT \
  'https://httpbin.org/anything/foo?q=bar' \
  -H 'Cache-Control: no-cache' \
  -H 'Content-Type: application/json' \
  -H 'X-Custom: baz' \
  -d '{"key": "value"}'
```

Check the resonse manually

```json
{
  "args": {
    "q": "bar"
  },
  "data": "{\"key\": \"value\"}",
  "files": {},
  "form": {},
  "headers": {
    "Accept": "*/*",
    "Cache-Control": "no-cache",
    "Connection": "close",
    "Content-Length": "16",
    "Content-Type": "application/json",
    "Host": "httpbin.org",
    "User-Agent": "curl/7.52.1",
    "X-Custom": "baz"
  },
  "json": {
    "key": "value"
  },
  "method": "PUT",
  "origin": "113.116.157.5",
  "url": "https://httpbin.org/anything/foo?q=bar"
}
```
Use Htte for api testing. First write the test file `httpbin.yaml`

```yaml
units:
  - describe: httpbin demo
    api:
      uri: https://httpbin.org/anything/foo
      method: put
    req:
      query:
        q: bar
      headers:
        X-Custom: baz
      body:
        key: value
    res:
      body:
        args:
          q: bar
        data: '{"key":"value"}'
        files: {}
        form: {}
        headers: !@object
          X-Custom: baz
        json:
          key: value
        method: PUT
        origin: !@regexp /^([0-9]{1,3}\.){3}[0-9]{1,3}$/
        url: 'https://httpbin.org/anything/foo?q=bar'
```

Execute the test with cli
```
htte
```
> Run `npm i -g htte` to install cli tool. make sure you have installed [node.js](https://nodejs.org).

The result is
```
RunUnits:
  test:
    httpbin demo:
      ✓
```
You see the test is passed.

The user describe the request and response of API in the file. Htte automatically makes a request for you and sends it to the server, receives the response from the server, performs data verification, and finally prints the test results for you.

In order to verify that Htte really does validate the response data, we can modify the test file:
```yaml
        json:
        # key: value
          key: Value
```

The result is
```
RunUnits:
  test:
    httpbin demo:
      res:
        body:
          json:
            key:
              value diff, "Value" ≠ "value"
```
You can see that the test failed because the actual value `value` of the response body data `json.key` does not match the expected value `Value`.

Htte automatically makes a request through the test file and verifies the response. Writing a test is actually describing the request and expected response in YAML format.

## Plugin

Htte uses plugins to customize request data generation and response data validation.

> Using YAML We can write tests intuitively. Testing api is nothing more than describing its request and response data in YAML. However, this strategy has a serious problem. Not all data (such as current time) are fixed and can be described directly. We need to generate response data in a flexible way. It is completely impossible to check the response data with equal judgment alone. We need flexibility, we need to customize, these are provided by plugins, and plugins can cover these requirements.

Writing test file `plugin.yaml`
```
units:
  - describe: httpbin demo
    api:
      uri: https://httpbin.org/anything
      method: post
    req:
      body:
        foo: !$concat [ Bearer, ' ', !$randstr ]
        bar: !$datetime
    res:
      body: !@object
        json:
          foo: !@regexp /^Bearer \w{6}$/
          bar: !@exist
```

Execute the test with cli
```
htte --debug
```
> Options `--debug` activate debug mode, Htte will print actual request and response data.

The result is
```
RunUnits:
  plugin:
    httpbin demo:
      ✓
      debug:
        req:
          url: 'https://httpbin.org/anything'
          method: post
          body:
            foo: Bearer EtVcQr
            bar: '2018-05-10T13:46:37.467Z'
        res:
          status: 200
          body:
            args: {}
            data: '{"foo":"Bearer EtVcQr","bar":"2018-05-10T13:46:37.467Z"}'
            files: {}
            form: {}
            headers:
              Accept: 'application/json, text/plain, */*'
              Connection: close
              Content-Length: '56'
              Content-Type: application/json
              Host: httpbin.org
              User-Agent: axios/0.18.0
            json:
              bar: '2018-05-10T13:46:37.467Z'
              foo: Bearer EtVcQr
            method: POST
            origin: 113.116.51.68
            url: 'https://httpbin.org/anything'
```

The prefix of `!$` means the plugin generates data.

```yaml
!$randstr => EtVcQr  Genereate random string
!$concat [ Bearer, ' ', !$randstr ] => 'Bearer EtVcQr'  Concat an array to return a string
!$datetime => '2018-05-10T13:46:37.467Z' Return current datetime
```

The prefix of `!@` means the plugin verifies the actual data.

```yaml
!@object => Verify object，but only compare the listed fields
!@regexp => Check whether the data matches the regexp
```
The biggest obstacle to writing tests in a descriptive language is the loss of flexibility, but the plug-in solves this problem perfectly.

## data-links

Data-links provide a way to get data from another test in a test.

> The tests is data-coupled. The authenticated API must curry a token that comes from login API? The common strategy for getting data from another test in one test is to use variables, which are what Postman and manual testing do. However, variables must be defined before they can be used, and they need to be named, may be in conflict, may be accidentally overwritten, and cumbersome and insecure. Data-links is another kind of attempt, unexpectedly flexible and safe!

Writing test file `data-link.yaml`
```yaml
units:
  - describe: get my ip address
    name: getIP
    api:
      uri: https://httpbin.org/get
    res:
      body: !@object
        origin: !@regexp /^([0-9]{1,3}\.){3}[0-9]{1,3}$/
  - describe: send my id address
    name: sendIP
    api:
      uri: https://httpbin.org/anything
      method: post
    req:
      body:
        ip: !$query $$getIP.res.body.origin
    res:
      body: !@object
        json:
          ip: !@query $$$req.body.ip
```
The test file contains two test cases, where test `sendIP` access test `getIP` response data `origin`. Don't look at the next analysis. Do you know how many links in the test file? What data do the data links link?

The answer is two:

- `$$getIP.res.body.origin` is a data link that points to the data `res.body.origin` under the test `getIP`.
- `$$$req.body.ip` is also a data link that points to the data in the same test unit where the access path is `req.body.ip`.

Data links are strings that must be combined with the plugin to make it work.

`!$query` will return the linked data.
`!@query` compares the linked data as expected with the actual response.

Data-links features:

- Flexible, data link can directly refer to any data
- Security, data referenced by the data link is read-only

## Serializer

The serializer is used to encode and decode the data. With an XML encoder only, you can test the API works with application/xml. Htte can test arbitrary format API if the serializer is provided.

> Htte uses YAML to describe requests and expected responses, so the internal data format is a JS object. Before the data is passed to the server, Htte needs to use an serializer to serialize the JS object data into a specific format. After receiving the response, Htte also needs to use the serializer to deserialize the specific format data into JS object.

The serializers is plubinable. Htte currently has two builtin serializers json and xml.

Serializ XML:

```yaml
units:
  - describe: httpbin xml
    api:
      uri: https://httpbin.org/post
      method: post
      type: xml
    req:
      body:
        key: value
    res:
      body: !@object
        data: '<key>value</key>'
```

According to `api.type`, Htte serializes the request data `req.body`as XML `<key>value</key>`.

Deserialize XML:

```yaml
units:
  - describe: httpbin xml
    api:
      uri: https://httpbin.org/xml
    res:
      body:
        slideshow:
          slide:
            - title: Wake up to WonderWidgets!
            - title: Overview
              item:
                - '#text': Whyare great
                  em: WonderWidgets
                - ''
                - '#text': WhoWonderWidgets
                  em: buys
```

The API `https://httpbin.org/xml` responds with XML data, and Htte decodes  that XML response data based on the response header `Content-Type`.

## Examples

- [Restful-Booker](./examples/restful-booker) — An API playground created by Mark Winteringham for those wanting to learn more about API testing and tools
- [Realword](./examples/realworld/) — Exemplary fullstack blog apps powered by React, Angular, Node, Django, and many more — it’s like TodoMVC, but for fullstack apps!

## License

[MIT](https://github.com/sigoden/htte/blob/master/LICENSE)
