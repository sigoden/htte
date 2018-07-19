# HTTE - 文档驱动的接口测试框架

## 初体验+入门

- 安装命令行
```
npm i htte-cli -g
```

- 编写配置文件 `htte.yaml`

```yaml
modules:
- auth
```

- 编写测试文档文件 `modules/auth.yaml`

```yaml
- describe: john登录
  name: loginJohn
  req:
    url: https://htte-realworld.herokuapp.com/api/users/login
    method: post
    body:
      user:
        email: john@jacob.com
        password: johnnyjacob
  res:
    body:
      user:
        email: john@jacob.com
        username: johnjacob
        token: !@exist
- describe: john更改用户名
  includes: updateUser
  req:
    headers:
      Authorization: !$concat ['Bearer', ' ', !$query loginJohn.res.body.user.token]
    body:
      user:
        username: johnjacobII
  res:
    body: !@object
      username: johnjacobII
```

- 执行测试
```
htte htte.yaml
```

## 特性

- 更容易读
- 更容易读
- 编程语言无关性
- 技能要求低，上手快
- 效率高，开发快
- 天然适合测试驱动开发
- 作为前端接口使用说明
- 作为后端需求文档/开发指导文件
- 使用 YAML 语言
- 使用插件灵活生成请求校验响应
- 组件化，易扩展
- 接口协议可扩展，目前支持 HTTP/GRPC
- 报告生成器可扩展，目前支持 CLI/HTML
- 优雅解决的数据耦合
- 使用宏减少重复书写
- 边调试边开发

[更多](https://github.com/sigoden/htte#readme)
