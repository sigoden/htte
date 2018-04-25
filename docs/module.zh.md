## 模块

每个模块都是一个 yaml 文件。这些模块文件由模块依赖和测试集两部分组成。

### 依赖

依赖用来保证执行顺序。

接口的执行是有序的，用户必须注册之后才能发布文章。Htte 是通过目录加载模块的，模块的顺序先来自文件路径排序，然后通过依赖关系进一步排序。
比如有模块 auth 包含注册登录相关接口，有模块 article 包含用户文章 CRUD 相关接口，显然 auth 应该排在 article 之前，通过设置 article 模块依赖 auth 模块，可以保证这种顺序。

此外，模块只能使用它所依赖的模块所对应的模块变量。

依赖的添加到 `dependencies` 字段内，包含的信息有: 模块路径，模块引用名。如果没有指定模块引用名，htte使用通过模块路径生成的模块名。

采用数组形式，

```yaml
dependencies:
  - ./auth.yaml
  - name: article
    module: ./article.yaml
```

采用散列表形式,
```yaml
dependencies:
  auth: ./auth.yaml
  article: ./article.yaml
```

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

### 单元测试

单元测试是 htte 的测试的基本单位。它描述了如何进行请求以及如何比对校验响应。

一个单元测试可以有下列字段

```yaml
describe:
api:
name:
req:
  params: 
  headers:
  query:
  body:
res:
  status:
  headers:
  body:
```

- describe, 测试描述，必须
- api, 该测试使用的接口，必须是配置中 apis 涉及了的接口
- name, 测试导出变量名，只有提供了该字段，本模块内的其它测试和其它模块才能通过变量引用到该测试里的数据
- req, 请求数据
  - params, 请求的 url 路径参数。 如 api 路径为 `/articles/{slug}/comments/{id}`, params 为 `{ slug: ???, id: ??? }`。params 里的属性必须完全对应 api 里的路径参数。
  - query, 请求路径 querystring, 以散列表形式填写。
  - headers, 请求头
  - body, 请求数据
- res, 响应数据
  - status, 响应状态码，如果为空，则断言响应码在 200-299 范围内。
  - headers, 响应头
  - body, 响应数据
