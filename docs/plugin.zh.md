## 插件

### 概述

所谓接口测试，就是给出请求数据，然后对比响应数据。但有时我们无法直接给出请求数据, 比如当前时间，难道每次测试都手动更改吗？
有时我们也无法完全确定响应数据，可能返回值尾部添了一个随机字段。为了解决这些问题，hest 引入了插件。

插件实际上是一种函数，只有函数才具有完成各种各样功能的可能性。它已 yaml 标签形式存在，简单安全便捷。

### 类别

插件有两类:

- resolver, 用来生成请求数据, 其 yaml 标签带有前缀 `!$`
- differ, 用来对比验证响应数据, 其 yaml 标签带有前缀 `!@`

插件作为一类特殊的 yaml 标签，它们可以接受参数，可能的参数类型有:

- 单值(scalar)
- 散列表(mapping)
- 数组(sequence)

标签后如果没有接参数，则使用默认参数 `null`

### 内置插件

#### resolver

##### !$query
`!$query`: 查询变量值, 参数类型为 scalar

```yaml
!$query $auth.login.req.body.user.token # 返回 auth 模块下的名为 login 测试的响应数据中的 user.token 值
```

##### !$concat
`!$concat`: 连接一组字符串, 参数类型为 sequence

```yaml
!$concat: [a, b, c] # "abc"
!$concat: [Bearer, ' ', !$query $auth.login.req.body.user.token] # "Bearer <token值>", 参数可以嵌套其它 resolver
```

##### !$now
`!$now`: 当前时间字符串, 参数类型为 scalar

接受一个参数 offset，表示当前时间偏移毫秒树

```yaml
!$now # 2018-04-25T02:29:03.572Z，当前时间
!$now 86400000 # 2018-04-26T02:29:03.572Z, 明天
!$now -86400000 # 2018-04-24T02:29:03.572Z, 昨天
```

##### !$randstr
`!randstr`: 随机字符串，参数类型为 scalar

接受一个参数 length，表示随机字符串长度

```yaml
!$randstr # 5xa4Wi
!$randstr # Qdf4dY
!$randstr 8 # 9sw2DhxH
```

#### differ

##### !@query
`!@query`: 是否等于变量值, 参数类型为 scalar

```yaml
res:
  body:
    email: !@query $$$res.body.email
```
如果响应数据有字段 email 且与请求数据 email 值相等，为真


##### !@exist
`!@exist`: 是否存在字段，参数类型为 scalar

```yaml
res:
  body:
    username: !@exist
    token: !@exist
```
如果测试返回的结果是对象，有且仅有属性 username, token, 为真。不关注具体值，仅关注属性存在与否。

##### !@regexp
`!@regexp`: 是否匹配正则，参数类型为 scalar

```yaml
res:
  body:
    slug: !@regexp /^how-to-train-your-dragon-\\w{6}$/
```
如果响应数据有字段 slug，为字符串且匹配正则，为真


##### !@array
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
hest 默认情况下会对数组进行全等校验。这意味着必须列出全部元素，并保证顺序和值正确。


##### !@object
`!@object`: 对象部分校验，参数类型会 mapping

```yaml
res:
  body: !@object
    email: john@jacob
```
如果响应数据中用字段 email 且值为 john@jacob 为真。如果省略 `!@object` 标签，表示数据有且仅有字段 email。

hest 默认情况下会对对象进行全等校验。不能有多的字段，也不能有少的字段。
