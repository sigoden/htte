# HTTE - 文档驱动的接口测试框架

为什么接口需要测试？
- 提高服务质量，减少 Bug
- 更早定位 Bug，节省调试和处理时间
- 更容易进行代码变更和重构，避免代码腐化
- 测试也是文档，有助于熟悉服务功能和逻辑
- 服务验收标准

有许多项目却没有接口测试，因为测试难，难在：
- 编写测试让工作量翻倍
- 编写测试代码需要一定的学习成本
- 接口间数据耦合使测试不容易编写
- 构造请求数据和校验相应数据本身就很枯燥繁琐
- 测试代码也是代码，不花经历优化迭代的话也会腐化

有没有一条策略，既能让我们享受到测试带来的益处，又能最大程度的降低其成本呢？

测试一个功能，无非是给它一定输入，然后看它输出对不对。测试难的本质不在于测试的概念和方法思路上，而在其代码量上。

既然用代码来承载并执行测试存在问题，有没有更好的方式呢？

有，那就是文档。这就是 HTTE 诞生的初衷。

## 文档驱动的优点

1. 更容易写

有这样一个接口：它的服务访问地址是 `http://localhost:3000/add`，采用 `POST` 并使用 `json` 作为数据交换格式，请求数据格式 `{ a: number, b: number}`，返回数据格式 `{c: number}`，实现的功能就是求和并返回结果。

测试思路： 向这个接口传递数据 `{"a":3,"b":4}`，并期待它返回`{"c":7}`

这个测试在 HTTE 中是这样呈现的。

```yaml
- describe: 两个数相加
  req:
    url: http://localhost:3000/add
    method: post
    headers:
      Content-Type: application/json
    body:
      a: 3
      b: 4
  res:
    body:
      c: 7
```

2. 更容易读

请看下面两个测试，猜猜接口的功能。

```yaml
- describe: 登录
  name: fooLogin
  req:
    url: /login
    method: post
    body:
      email: foo@example.com
      password: '123456'
  res:
    body:
      token: !@exist
- describe: 更改昵称
  req:
    url: /user
    method: put
      Authorization: !$conat [Bearer, ' ', !$query fooLogin.res.body.token]
    body:
      nickname: bar
  res:
    body:
      msg: ok
```

尽管你现在可能不理解 `!@exist`, `!$concat`, `!$query` 等是什么，但应该能粗略明白这两个接口的功能、请求响应数据格式。

由于测试逻辑由文档承载，HTTE 轻而易举获得一些其它框架梦寐以求的优点：

3. 编程语言无关性

完全不需要 care 后端是那种语言实现的，再也不担心从一门语言切换到另一门语言，更遑论从一个框架切换到另一个框架了。

4. 技能要求更低，上手快

纯文档，不需要熟悉后端的技术栈，甚至不需要会编程。文职？

5. 效率高，开发快

容易写，又容易读，技能要求又低，当然开发快。自由的享用本文开头所列举的测试带来的优点，又最大的避免测试带来的麻烦。

6. 天然适合测试驱动开发

文档写起来比代码容易多了，先写不再是那么难。可以无副作用享受 TDD 的优点了。

7. 作为前端接口使用说明

即使有 swagger/blueprint 文档还是不会用接口怎么办？把测试文档扔给他，满满的都是例子。

8. 作为后端需求文档/开发指导文件


## HTTE 优点

9. 组件化，灵活，易于扩展

10. 插件齐全且可扩展 

11. 接口协议可扩展，已支持 http/grpc

12. 报告格式可扩展，已支持 cli/html

## 快速入门

## 项目配置

## 用例编写

## 链接

### 插件

[内置](./packages/htte-plugin-builtin)

### 协议

[htte](./packages/htte-client-http)
[grpc](./packages/htte-client-grpc)

### 报告器

[cli](./packages/htte-reporter-cli)
[html](./packages/htte-reporter-html)

## 命令行