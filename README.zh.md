# Htte

Htte 是一款描述式 HTTP 测试框架。

> 语言 [English](README.md) | [中文](README.zh.md)

## 特性

- 描述式，对后端编程语言不敏感
- 插件系统，可以灵活的处理或生成请求数据，自由的断言比对响应数据
- 变量，自动记录测试接口的请求和响应数据，以供后续测试引用

## 入门

安装 htte 命令行工具

```
npm i htte -g
```

编写项目配置文件 `.htte.yaml`

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

创建测试用例文件 `user.yaml`

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
          username: john
```

运行测试

```
htte

RunUnits:
  user:
    register user:
      ok [278.416928ms]
    update user data:
      ok [143.124919ms]
```

> 上面仅测试了部分接口，更全的版本详见[realworld](https://github.com/sigoden/node-express-realworld-example-app.git)。


### 原理

htte 读取测试描述文件 `.htte.yaml`, 得知有两个用例要进行测试 `register user` 和 `update user data`

htte 开始执行用例 `register user`, 根据其 api 字段查询配置文件得到请求方法和路径。

htte 会向 `register` 接口发送请求，根据 req 字段生成请求数据。

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

htte 接着会检验响应的数据, 根据 res 字段自动进行下列断言。

- 响应数据中存在 user 对象
- user 对象有且仅有 email, username, token 属性
- user 属性 email 值为 john@jacob.com
- user 属性 username 值为 johnjacob
- user 有属性 token

有任何一条失败，都会导致测试结果不通过。

`!@exist` 是 yaml 标签，实际上是一种由插件系统提供的函数，断言字段存在。

> htte 提供了插件系统允许用户编写响应数据校验方法。例如 `!@regexp` 可以用例正则匹配。

htte 执行用例 `update user`, 生成请求数据。

```
url: http://localhost:3000/api/user
method: put
headers:
  Content-Type: application/json
  Authorization: Token <注册返回的 token 数据>
body: |
  {
    "user": {
      "username": "john"
    }
  }
```

`!$query` 也是 yaml 标签，它会进行变量查询。htte 会记录所有用例的请求和响应数据，可以通过该标签获取。

> htte 提供了插件系统允许用户自定义请求数据的产生行为。例如 `!$now` 会生成当前时间字符串,
> `!$randstr` 生成随机字符串。

htte 接着同样会检验响应的数据。进行如下断言。

- 响应数据中存在 user 对象
- user 属性 username 值为 john

> 如果没有 `!@object`, htte 将对 user 对象进行全属性校验，这意味着属性字段不能多也不能少。
> 有时候我们仅关注对象的某个字段，可以使用 `!@object`  比对器进行对象的部分校验。

### 文档

- [配置](./docs/config.zh.md)
- [模块](./docs/module.zh.md)
- [插件](./docs/plugin.zh.md)
- [变量](./docs/variable.zh.md)
- [命令行](./docs/cli.zh.md)
 
### 许可证

[MIT](https://github.com/sigoden/htte/blob/master/LICENSE)
