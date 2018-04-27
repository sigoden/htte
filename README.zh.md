# Htte

[![Node Version](https://img.shields.io/badge/node-%3E=4-brightgreen.svg)](https://www.npmjs.com/package/htte)
[![Build Status](https://travis-ci.org/sigoden/htte.svg?branch=master)](https://travis-ci.org/sigoden/htte)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/f019843d36f643378a26840660c10f61)](https://www.codacy.com/app/sigoden/htte?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=sigoden/htte&amp;utm_campaign=Badge_Grade)
[![Coverage Status](https://coveralls.io/repos/github/sigoden/htte/badge.svg?branch=master)](https://coveralls.io/github/sigoden/htte?branch=master)
[![dependencies Status](https://david-dm.org/sigoden/htte/status.svg)](https://david-dm.org/sigoden/htte)
[![Known Vulnerabilities](https://snyk.io/test/github/sigoden/htte/badge.svg?targetFile=package.json)](https://snyk.io/test/github/sigoden/htte?targetFile=package.json)

Htte 是一款描述式 HTTP 测试框架。

> 翻译: [English](README.md) | [中文](README.zh.md)

编写完 API 接口后，我们需要测试其功能。手动一条一条用 Postman 和 curl 测试也是一种方式，但是缺点显而易见。
严谨精明的程序员常常会编写一些测试程序来完成这项工作。 一般是生成请求数据，再通过 http 发送请求，最后断言响应是否匹配预期。

下面是就注册和修改用户信息接口的测试举例, Node.js 下实现是这样的：

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

如何使用 htte 来实现这两个测试呢？

首先我们需要编写一个配置文件 `.htte.yaml` 来描述接口

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

然后我们编写测试 `user.yaml`

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

改写完成.

我们可以使用 htte 命令行工具运行测试 

```sh
$ htte # 执行测试, 如果找不到命令，可以使用 npm i -g htte 安装

RunUnits: 
  user:
    regist user:
      ✓
    update user data:
      ✓
```

> 上面的接口截取自 [realworld](https://github.com/sigoden/node-express-realworld-example-app.git)项目。 该项目采用 htte 进行接口测试，可以作为例子学习如何使用 htte。

## 特性

- 使用描述式语言 YAML 编写测试
- 不与后端开发语言耦合
- 无技能要求，不需要会编程也能编写测试
- 直白描述请求需要的数据和响应返回的数据, 简单，易理解，已编写
- 可以使用插件自定义生成请求数据及断言响应数据，提供了灵活性又不失简洁
- 提供 jsonpath 变量机制处理测试接口间的数据耦合，简单方便安全

## 内容

- [配置](#配置)
- [测试代码](#测试代码)
    - [依赖](#依赖)
    - [测试集](#测试集)
    - [测试单元](#测试单元)
- [插件](#插件)
    - [为什么需要插件](#为什么需要插件)
    - [插件是如何工作的](#插件是如何工作的)
    - [插件的种类](#插件的种类)
    - [内置插件](#内置插件)
- [变量](#变量)
    - [为什么需要变量](#为什么需要变量)
    - [变量是如何定义的](#变量是如何定义的)
    - [变量名规则](#变量名规则)
    - [全局变量](#全局变量)
- [命令行](#命令行)
    - [run](#run)
    - [inspect](#inspect)
    - [view](#view)

## 配置

htte 为了完成测试工作，需要知道从哪儿加载测试文件，有哪些接口可以使用及如何发送请求，有哪些插件需要加载等配置信息。
这些配置信息统一存储到一个 yaml 格式的配置文件中。 配置文件通过命令行参数 `-c` 或 `--config` 指定。

下面列出了所有的可配置项及其解释。

```yaml
rootDir: '.' # 用来指定测试文件所在的根目录，htte 会递归读取该目录下的所有 yaml 文件并将其作为测试模块解析。
sessionFile: ./.session # 用来持久化会话的文件，htte 使用该文件记录测试的请求和响应数据以及测试中断位置
url: http://localhost:3000 # 表示所有接口路径的基地址，接口路径为相对路径时会拼接该地址得到完整路径
serializers: [] # 由一组 npm 模块组成的列表，向 htte 中注册转码器，转码器设置 `Content-Type` 请求头, 转码请求数据，以及解码响应数据。
type: json # `type` 指定默认转码器类型。
timeout: 1000 # 设置请求超时时间, 单位为毫秒, 请求超过该时间会自动中断并报错。
apis: {} # 定义接口
variables: {} # 提供全局变量
plugins: [] # 由一组 npm 模块组成的列表，向 htte 中插件。
```

`apis` 是必须字段, 代表一组接口信息。

接口相关信息有: 请求命名, 请求路径（必须），请求方法（默认 get），请求数据转码类型, 超时。

可以使用散列表形式

```yaml
apis:
  register:
    method: post
    uri: /users
    type: 'json'
    timeout: 300
  getUser: /user
```

也可以采用数组形式

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

## 测试代码

所有测试代码全部放在一个文件中显然不是一种好选择。htte 允许测试代码分散到多个文件中。

每个文件都将被视做一个模块。

模块包含两部分：模块依赖 `dependencies` 和测试集 `units` 。

### 依赖

依赖用来保证执行顺序。

接口的执行是有序的，用户必须注册之后才能发布文章。Htte 是通过目录加载模块的，模块的顺序先来自文件路径排序，然后通过依赖关系进一步排序。
比如有模块 auth 包含注册登录相关接口的测试，模块 article 包含用户文章 CRUD 相关接口的测试，只有注册用户才能发表文章，所以模块 auth 应该排在模块 article 之前，通过设置 article 模块依赖 auth 模块，保证了这种顺序。

字段 `dependencies` 的值由一组的依赖对象组成, 依赖对象有属性：模块路径，模块引用名。模块路径必须，而模块引用名可选，如果没有指定模块引用名，htte 使用通过模块路径自动生成的模块名。

字段 `dependencies` 的值可以采用数组形式，

```yaml
dependencies:
  - ./auth.yaml
  - name: article
    module: ./article-authenticated.yaml
```

也可以采用散列表形式,

```yaml
dependencies:
  auth: ./auth.yaml
  article: ./article-authenticated.yaml
```

关于依赖有如下几点要注意:

- 如果形成循序依赖, htte 会识别到并直接报错。
- 依赖影响模块内的变量查询。只有添加了依赖，你才能使用所依赖模块内的数据，才能使用相应的变量。

### 测试集

测试集和包含单元测试和子测试集 

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

顶级测试集包含了单元测试 `feed` 和子测试集 `article without auth`, 子测试集有包含了一个单元测试 `all articles`。 测试集可以包含任意数量和任意层级的单元测试和子测试集。


### 测试单元

测试单元是描述了如何进行请求以及如何比对校验响应。

一个单元测试例子：

```yaml
describe: test an api # 测试描述，该字段必须
api: endpoint # 测试使用的接口，必须是配置中 `apis` 涵盖了的, 该字段必须
name: endpoint-001 # 变量导出名, 其它测试使用该 
req: # 请求数据
  params: { slug: 'htte', id: 3 } # 请求的 url 路径参数。
  headers: { Authorization: 'Bearer ...'} # 请求头
  query:  { page: 3, size: 20 }  # 请求路径 querystring, 以散列表形式填写。
  body: { content: 'go! go! go!' } # 请求数据
res: # 响应数据 
  status:  200 # 响应状态码，如果为空，则断言响应码在 200-299 范围内。
  headers: { Content-Length: '26' } # 响应头
  body: !@object { json: { content: 'go! go! go!' } } # 响应数据
```

如果其接口是这样的
```
method: post
name: endpoint
uri: https://httpbin.org/anything/{slug}/{id}
```

上面的测试会生成如下请求:
```
curl \
   -X POST \
   -H 'Content-Type: application/json' \
   -H 'Authorization: Bearer ...' \
   -d '{"content": "go! go! go!"}' \
   https://httpbin.org/anything/htte/id
```

htte 将进行如下校验:

- 响应状态码 200
- 响应头中包含字段 Content-Length, 且值为 26
- 响应体中是一个对象，该对象有一个字段 json, 其值为也是一个对象为 `{content: 'go! go! go!'}`

如果校验全部通过，则测试通过，有一条失败，则测试失败。

如下几点要特别注意:
- 仅 `describe` 和 `api` 是必须的
- `req.params` 必须与 api 对象中的路径参数对应。如 api 对象有路径 `/articles/{slug}/comments/{id}`, `req.params` 必须具有属性 slug 和 id
- 单元测试 `name` 只有提供了该字段，本模块内的其它测试和其它模块才能通过变量引用到该测试里的数据

## 插件

### 为什么需要插件

所谓接口测试，就是给出请求数据，然后对比响应数据。

有时我们无法直接给出请求数据, 比如当前时间。有时我们也无法完全确定响应数据，比如返回值可能尾部跟个随机字段。测试具有灵活性，而描述文档却呆板的。我们无法写下当前时间。也许我们可以约定某个符号代表当前时间，但谁知道将来会再碰到哪些类似问题呢？显然没碰到一次问题就约定一个符号是不现实的。

我们需要函数，只有函数才具有灵活性，才能应付这些挑战。

插件提供函数，我们需要插件。

### 插件是如何工作的

htte 使用 yaml, 为了理解插件工作原理，我们必须先学习一些 yaml 规范。

在 yaml 中，有 4 种数据类型。

- 标量(scalar)
- 数组(sequence)
- 散列表(mapping)
- 标签(tag)

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

标签在使用前必须注册。注册标签需要传递解析引擎这些数据: 标签名，参数的数据类型，构造函数。 当解析引擎碰到标签后，会解析标签后面的数据并将其作为参数调用标签的构造函数，以构造函数执行结果作为最终值。函数以标签的显示出现在 yaml 文件中。

注册插件就是像 yaml 解析引擎中注册标签。 插件以 yaml 标签的形式提供函数。

### 插件的种类

htte 提供了两类插件 

- resolver
  用来生成请求数据, 其 yaml 标签带有前缀 `!$`, 如 `!$now` 返回当前时间字符串

- differ
  用来对比验证响应数据, 其 yaml 标签带有前缀 `!@`, 如 `!@regexp` 验证数据是否是否匹配正则

### 内置插件

htte 提供了一些内置插件，这些插件不需要额外安装，可以直接使用。

这些插件的功能和基础，一般测试中都有用到。 它们也是例子，可以参照它们编写你自己的插件。如果你发现某个重要的功能应该包含在内置插件中，欢迎提交 issue 或 pull request.

#### !$query
`!$query`: 查询变量值, 参数类型为 scalar

```yaml
!$query $auth.login.req.body.user.token # 返回 auth 模块下的名为 login 测试的响应数据中的 user.token 值
```

#### !$concat
`!$concat`: 连接一组字符串, 参数类型为 sequence

```yaml
!$concat: [a, b, c] # "abc"
!$concat: [Bearer, ' ', !$query $auth.login.req.body.user.token] # "Bearer <token值>", 参数可以嵌套其它 resolver
```

#### !$now
`!$now`: 当前时间字符串, 参数类型为 scalar

接受一个参数 offset，表示当前时间偏移毫秒树

```yaml
!$now # 2018-04-25T02:29:03.572Z，当前时间
!$now 86400000 # 2018-04-26T02:29:03.572Z, 明天
!$now -86400000 # 2018-04-24T02:29:03.572Z, 昨天
```

#### !$randstr
`!randstr`: 随机字符串，参数类型为 scalar

接受一个参数 length，表示随机字符串长度

```yaml
!$randstr # 5xa4Wi
!$randstr # Qdf4dY
!$randstr 8 # 9sw2DhxH
```

#### !@query
`!@query`: 是否等于变量值, 参数类型为 scalar

```yaml
res:
  body:
    email: !@query $$$res.body.email
```
如果响应数据有字段 email 且与请求数据 email 值相等，为真


#### !@exist
`!@exist`: 是否存在字段，参数类型为 scalar

```yaml
res:
  body:
    username: !@exist
    token: !@exist
```
如果测试返回的结果是对象，有且仅有属性 username, token, 为真。不关注具体值，仅关注属性存在与否。

#### !@regexp
`!@regexp`: 是否匹配正则，参数类型为 scalar

```yaml
res:
  body:
    slug: !@regexp /^how-to-train-your-dragon-\\w{6}$/
```
如果响应数据有字段 slug，为字符串且匹配正则，为真


#### !@array
`!@array`: 数组部分校验，参数类型为 mapping

```yaml
res:
  body: !@array
    0: dragon
```
如果响应数据字段值为数组且第一个元素值为 dragon，为真
这里我们仅对第一个元素敢兴趣，所以仅做部分校验。

如果我们还对数组长度敢兴趣，可以断言长度

```yaml
res:
  body: !@array
    0: dragon
    length: 4
```
htte 默认情况下会对数组进行全等校验。这意味着必须列出全部元素，并保证顺序和值正确。


#### !@object
`!@object`: 对象部分校验，参数类型会 mapping

```yaml
res:
  body: !@object
    email: john@jacob
```
如果响应数据中用字段 email 且值为 john@jacob 为真。如果省略 `!@object` 标签，表示数据有且仅有字段 email。

htte 默认情况下会对对象进行全等校验。不能有多的字段，也不能有少的字段。

## 变量

变量是一种访问已完成测试的请求和响应数据的机制。

### 为什么需要变量

Web 服务一般来说是有状态的，造成接口之间存在数据联系。用户如果要发表文章，需要先注册。因为发表文章的接口需要注册接口里的 token 数据。
需要一种机制来获取前面测试中的数据。这种机制就是变量。

### 变量是如何定义的

htte 执行单元测试时，会生成相关的请求和响应数据, 这些数据被记录在会话中，并会持久化到磁盘 `sessionFile`。

以单元测试 `registJohnToken`（代码位于文章头部）为例，其会产生如下记录：

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

- `auth` 是模块名，根据模块路径自动生成
- `registJohnToken` 来自单元测试的 `name` 字段
- `req` 对应单元测试里的请求数据
- `res` 是 Web 服务返回的响应数据

> 可以使用 htte inspect 命令行工具查看单元测试信息

这是一个庞大的对象，但我们使用是常常只需要某个具体的值，比如 token，比如 username。为每个需要的数据建立一个变量很繁琐。而且可能写测试时也不知道那些将会是变量。
为了获取特定数据的值, htte 采用 [jsonpath](https://github.com/dchtteer/jsonpath) 定位数据，数据的访问路径就是变量名， 变量使用前不需要申明，也不需要绑定变量名，数据的任何部分都可以作为变量被访问。

我们需要获取 token 字段的值，其 jsonpath 为 `auth.registerJohn.res.body.user.token`, 变量名为 `$auth.registerJohn.res.body.user.token`, yaml 中通过标签获取： `!$query $auth.registerJohn.res.body.user.token`。

### 变量名规则

变量名即数据的 jsonpath 路径。为了实现跨模块访问数据，变量名包含模块名和测试名, 前缀 `$`。

如果引用本模块内的测试的数据，则可以省略模块名，`$$registerJohn.res.body.user.token`, 前缀 `$$`。

如果是同一个测试内，res 内部引用 req 中的数据, 则可以省略测试名，`$$$req.body.user.email`, 前缀 `$$$`。

### 全局变量

全局变量的数据来自配置中的 `variables` 字段，也是以 jsonpath 作为变量名。前缀 `$$$$`。

## 命令行

### 全局选项

- config: 项目配置文件路径，默认 `./.htte.yaml`

### run

运行测试, 为默认命令，`htte` 等同于 `htte run`.

选项:

- debug: 打印请求和响应数据　
- amend: 从上次中断的地方开始运行测试
- bail: 测试不通过，则中断后续测试
- unit: 从指定的单元测试处开始运行测试
- shot: 执行单个测试，不再运行后续测试 

### inspect

审视特定单元测试，显示该测试相关的所以信息 

```
$ htte inspect auth-registerJohn

name: registerJohn
module: auth
api:
  name: register
  method: post
  url: 'http://localhost:3000/api/users'
  timeout: 1000
  type: json
  keys: []
req:
  body:
    user:
      email: john@jacob.com
      password: johnnyjacob
      username: johnjacob
res:
  status: 200
  headers:
    x-powered-by: Express
    access-control-allow-origin: '*'
    vary: X-HTTP-Method-Override
    content-type: application/json; charset=utf-8
    content-length: '237'
    etag: W/"ed-/KWrmVNj/2bN/mK81GyveA"
    date: 'Fri, 27 Apr 2018 08:41:44 GMT'
    connection: close
  body:
    user:
      username: johnjacob
      email: john@jacob.com
      token: >-
        eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJqb2huamFjb2IiLCJleHAiOjE1MzAwMDI1MDQsImlhdCI6MTUyNDgxODUwNH0.WF-5H8bHNZqMvr8fXZpp6IFCysR0-vQ7T6p1iTQ7tJ0
  time: 312.791432

 ```

### view

查看测试, 可以看到所有的测试及其结构。

选项:

- module: 仅显示特定模块下的测试
- api: 仅显示特点 api 的测试 

```
ViewUnits: 
  user:
    regist user:
      registerJohn
    update user data:
      updateUser-1
```
 
## 许可证

[MIT](https://github.com/sigoden/htte/blob/master/LICENSE)
