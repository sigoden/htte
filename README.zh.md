# Htte

[![Node Version](https://img.shields.io/badge/node-%3E=4-brightgreen.svg)](https://www.npmjs.com/package/htte)
[![Build Status](https://travis-ci.org/sigoden/htte.svg?branch=master)](https://travis-ci.org/sigoden/htte)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/f019843d36f643378a26840660c10f61)](https://www.codacy.com/app/sigoden/htte?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=sigoden/htte&amp;utm_campaign=Badge_Grade)
[![Coverage Status](https://coveralls.io/repos/github/sigoden/htte/badge.svg?branch=master)](https://coveralls.io/github/sigoden/htte?branch=master)
[![dependencies Status](https://david-dm.org/sigoden/htte/status.svg)](https://david-dm.org/sigoden/htte)
[![Known Vulnerabilities](https://snyk.io/test/github/sigoden/htte/badge.svg?targetFile=package.json)](https://snyk.io/test/github/sigoden/htte?targetFile=package.json)

Htte 是一款 HTTP 接口自动化测试框架。

> 翻译: [Englist](./README.md) | [中文](./README.zh.md)

## 特性

- 采用 YAML 编写测试，上手简单，开发难度低，与后端代码无耦合
- 接口测试简化成描述请求和响应
- 提供插件自定义请求数据生成和响应数据断言
- 提供数据链路访问其它测试的数据和配置导出数据
- 接口编码可配置，内置 json(application/json)

## 开始使用

### 安装

Htte 是一款使用 Javascript 编写的命令行应用。为了保证 Htte 的正常运行，你需要先安装 [Node.js](https://nodejs.org/en/).
运行命令 `node --version` 和 `npm --version` 确保 Node.js 能正常运行。

安装 htte
```
npm install -g htte
htte --version
```

### 配置接口信息

假设有这样一个接口

```
功能: 用户登录
请求路径: localhost:3000/login
请求方法: POST
请求头: { "Content-Type": "application/json" }
请求数据: {"username": "john", "password": "johnsblog"}
响应:
  - 状况: 用户名和密码正确
    响应状态码： 200
    响应数据: {"username": "john", "token": "..."}
  - 状况: 用户名或密码不正确
    响应状态码： 401
    响应数据: {"errcode": 11001, "message": "invalid username or password"}
```

我们需要告诉 Htte 如何访问这个接口。在配置文件 `htte.yaml` 中添加接口信息

```yaml
url: http://localhost:3000
type: json
apis:
  login:
    method: post
    uri: /login
```

### 编写接口测试

这个接口存在两种情况，用户名和密码匹配时返回登录 token, 不匹配时返回错误信息。
我们需要测试这两种情况。编写接口测试文件 `login.yaml`

```yaml
units:
  - describe: 登录失败
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
  - describe: 登录成功
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

### 运行测试

我们需要运行 Web 服务器并确保接口能正常工作。

执行
```
$ htte
```

Htte 将读取配置文件 `htte.yaml` 和测试文件 `login.yaml`, 得到一系列测试单元，并逐一执行测试单元。
对每个测试单元，Htte 将根据其测试描述的请求生成请求并发送到对应接口，然后对接口响应与测试描述的响应比对。

## 文档

详见[官方网站](https://sigoden.github.io/htte)

- [入门](https://sigoden.github.io/htte/0.3/docs/)
- [配置文件](https://sigoden.github.io/htte/0.3/docs/config-file.html)
- [测试模块](https://sigoden.github.io/htte/0.3/docs/module-file.html)
- [插件](https://sigoden.github.io/htte/0.3/docs/plugin.html)

## 许可证

[MIT](https://github.com/sigoden/htte/blob/master/LICENSE)

