# HTTP 

该客户端用采用 HTTP 协议与接口服务进行通讯。

> 目前仅支持 JSON 这种数据交换格式。后期后陆续加入 `xml`, `multipart/form-data` 等

## 安装

该客户端插件默认安装，不需要用户单独安装。

## 配置

```yaml
- name: http
  pkg: htte-client-http
  options:
    baseUrl: http://example.com # 接口的基础路径，与 用例 `req.url` 拼接得到接口的完整访问路径
    timeout: 3000 # 请求超时
```

## 用例

```yaml
- describe: http test
  req:
    url: /math/{act} # 接口路径，如果配置中有定义 `baseUrl`，此处可以使用相对路径。
    method: put # 支持方法有: get, delete, head, options, post, put, patch; 大小写不敏感
    headers: # 请求头
      Authorization: Bearer ....
      X-Custom-Head: abc
    params: # 路径变量，用来补全 `url` 中的对应 `{\w+}` 部分，本例中 `url` 补全为 `/p/model/33`
      act: add
    query: #  查询字符串变量，本例中将生成查询字符串 `?size=20&page=3`
      size: 20
      page: 3
    type: json # 请求数据格式, 将添加请求头 `application/json; charset=utf-8`，并以 JSON 格式封装 `body` 中的数据。
    body: # 请求数据，结合 `type: json`，数据将已 `{"a":3,"b":4}` 的形式传递给接口服务。
      a: 3
      b: 4
    timeout: 1000 # 超时，覆盖配置中的全局超时设置。
  res:
    status: 200 # HTTP 响应码
    headers: # 响应头
        Expires: Wed, 18 Jul 2018 15:27:44 GMT
    body: # 相应数据, 将根据响应头 `Content-Type` 将相应数据转换会 JS 对象。以便比对。
      c: 7
```