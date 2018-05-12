# Htte —— 自动化声明式接口测试工具

[![Node Version](https://img.shields.io/badge/node-%3E=4-brightgreen.svg)](https://www.npmjs.com/package/htte)
[![Build Status](https://travis-ci.org/sigoden/htte.svg?branch=master)](https://travis-ci.org/sigoden/htte)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/f019843d36f643378a26840660c10f61)](https://www.codacy.com/app/sigoden/htte?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=sigoden/htte&amp;utm_campaign=Badge_Grade)
[![Coverage Status](https://coveralls.io/repos/github/sigoden/htte/badge.svg?branch=master)](https://coveralls.io/github/sigoden/htte?branch=master)
[![dependencies Status](https://david-dm.org/sigoden/htte/status.svg)](https://david-dm.org/sigoden/htte)
[![Known Vulnerabilities](https://snyk.io/test/github/sigoden/htte/badge.svg?targetFile=package.json)](https://snyk.io/test/github/sigoden/htte?targetFile=package.json)

> 翻译: [English](./README.md) | [中文](./README.zh.md)

## 特性

- 自动化，逐一执行测试文件中的测试用例
- 声明式，用 YAML 编写测试
- 语言无关性，平台无关性
- 插件化，可以自由生成响应数据，灵活校验响应数据
- 编码可扩展，内置 JSON/XML 编码器

## 开始使用

接口测试就是构造请求，校验响应。

使用 cURL 构造请求
```sh
curl -X PUT \
  'https://httpbin.org/anything/foo?q=bar' \
  -H 'Cache-Control: no-cache' \
  -H 'Content-Type: application/json' \
  -H 'X-Custom: baz' \
  -d '{"key": "value"}'
```

肉眼校验响应

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

使用 Htte 进行接口测试。首先编写测试文件 `httpbin.yaml`

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

运行测试文件
```
htte
```
> 使用 npm i -g htte 安装 htte 命令行工具，需要先安装 [node.js](https://nodejs.org/zh-cn/)

执行结果如下
```
RunUnits:
  test:
    httpbin demo:
      ✓
```

可以看到这条测试是通过的。

用户只需要测试文件中描述接口的请求和响应，Htte 自动为你构造请求并发送到服务器，从服务器接收响应并进行数据校验，最后打印测试结果。

为了验证 Htte 确实是会进行响应数据校验，我们可以修改测试文件:
```yaml
        json:
        # key: value
          key: Value
```

其执行结果为
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

可以看到测试是失败的，原因是响应体数据 `json.key` 的实际值 `value` 与 期望值 `Value` 不匹配。

Htte 通过测试文件自动构造请求并校验响应。编写测试其实就是用 YAML 格式描述请求和预期响应。

## 插件

Htte 使用插件自定义请求数据生成和响应数据校验。

> 采用 YAML 我们能直观的编写测试，测试一个接口无非是用 YAML 描述其请求和响应数据而已。但这种策略存在一个严重的问题。不是所有的数据（如当前时间）都是固定的可以直接描述的。我们需要灵活地生成响应数据，单单相等判断完全无法校验响应数据。我们需要灵活性，我们需要自定义，这些都有插件提供，这些插件也都可以提供。

编写测试文件 `plugin.yaml`
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
运行测试
```
htte --debug
```
> 选项 `--debug` 启用调试模式，会打印实际请求和响应数据

执行结果
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

`!$` 作为前缀的是生成类插件，用来生成一些特殊的数据

```yaml
!$randstr => EtVcQr 生成随机字符串
!$concat [ Bearer, ' ', !$randstr ] => 'Bearer EtVcQr' 拼接数组返回字符串
!$datetime => '2018-05-10T13:46:37.467Z' 返回当前时间
```

`!@` 作为前缀的是比对类插件，用来进行一些特殊的数据比对

```yaml
!@object => 比对对象，但仅比对列出的字段。
!@regexp => 校验数据是否匹配正则
```

采用描述性语言编写测试最大的障碍就是灵活性的丧失，但插件完美解决了这一问题。

## 数据链接

数据链接提供了一种从一个测试中获取另一个测试里的数据的方法。

> 测试间是有数据耦合的。权限接口不是通常要带个登录接口返回的 token 吗？从一个测试中获取另一个测试里的数据常见策略是使用变量，Postman 以及代码编写测试时就是这样做的。但是变量必须定义了才能使用，而且需要命名，可能冲突，可能被不小心覆盖了，繁琐又不安全。数据链接就是一种另一种尝试，意外的灵活有安全呢！

编写测试文件 `data-link.yaml`
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

该测试文件包含两个测试，其中测试 `sendIP` 要使用到测试 `getIP` 响应数据 `origin`。先不看接下来的分析，你知道存在几个数据链接，分别引用的是哪些数据吗？

答案时两处：

- `$$getIP.res.body.origin` 是一个数据链接，它指向同测试文件中名为 `getIP` 的测试下的访问路径是 `res.body.origin` 数据。
- `$$$req.body.ip` 也时一个数据链接，它指向同测试单元中访问路径为 `req.body.ip` 的数据。

数据链接是字符串，必须结合插件才能发挥其作用。

`!$query` 将返回链接的数据。
`!@query` 将链接的数据作为预期与实际响应进行全等比较。

- 灵活, 数据链路可以直接引用到任何数据
- 安全, 数据链路引用的数据是只读的

## 编码器

编码器用来编码、解码数据，只用有了 XML 编码器，你才能测试格式为 application/xml 的接口。只要有编码器，Htte 能测试任意格式接口。

> Htte 采用 YAML 描述请求和预期响应，内部数据格式是 JS 对象。在数据传给服务器前，Htte 需要使用编码器将 JS 对象码为特定格式。在收到响应后，Htte 也需要使用编码器将特定格式数据解码成 JS 对象。

Htte 的编码器可扩展，目前内置 json 和 xml 两种格式编码器。

XML 编码:

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

Htte 根据 `api.type` 得出接口请求数据编码是 XML, 并采用 xml 编码 `req.body` 的数据 `<key>value</key>`。

XML 解码:

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

接口 `https://httpbin.org/xml` 响应的是 XML 数据，Htte 根据响应头 `Content-Type` 选择编码器对响应体进行解码。

## 案例

- [Restful-Booker](./examples/restful-booker) —— 简单的图书管理应用，专为测试 API 创建演示站点
- [Realword](./examples/realworld/) —— 全栈博客应用

## 许可证

[MIT](https://github.com/sigoden/htte/blob/master/LICENSE)
