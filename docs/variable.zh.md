## 变量

变量是一种访问其它测试内数据的机制。

### 来源

有模块 auth, 它有一个测试 registerJohn, 其描述如下

```yaml
units:
  - describe: register
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
          email: !@query $$$req.body.user.email
          username: !@query $$$req.body.user.username
          token: !@exist
```
该测试完成后，hest 会在会话中添加如下一条记录

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

这条记录的任何部分都可以作为变量被访问。

### 访问路径

hest 使用 [jsonpath](https://github.com/dchester/jsonpath) 定位数据。

上面记录中 token 的 jsonpath: `$.auth.registerJohn.res.body.user.token`, 而其它模块访问该数据的使用的变量: `$auth.registerJohn.res.body.user.token`

### 类别

- 跨模块变量

跨模块变量用来引用其它模块内的测试数据，目标模块必须包含在模块的依赖列表中。变量前缀 `$`, 例如 `$auth.registerJohn.res.body.user.token`

- 模块内部变量

模块内部变量引用同模块内的测试数据，目标测试单元必须排在前面，且使用 `name` 导出数据。变量前缀 `$$`, 例如 `$$registerJohn.res.body.user.token`

- 同测试变量

同测试变量指同一个测试中， res 内部引用 req 内的数据。变量前缀 `$$$`, 例如 `$$$req.body.user.email`

- 全局变量

全局变量用来访问配置提过的 variables 内的数据。变量前缀 `$$$$`。
