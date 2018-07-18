# ECHO 

该客户端唯一的工作就是回显请求数据。`res` 中原封不动地返回 `req` 。

```yaml
- describe: echo
  req:
    body:
      a: 1
      b: 2
      c: 3
  res:
    body:
      a: 1
      b: 2
      c: 3
```

开发该插件初衷是为了方便插件测试。