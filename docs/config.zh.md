## 配置

配置文件通过命令行参数 `-c` 或 `--config` 指定，是一个 yaml 文件。htte 启动时会读取校验配置文件。 

### rootDir

其默认值为 `'.'`

`rootDir` 用来指定测试文件所在的根目录，htte 会递归读取该目录下的所有 yaml 文件并将其作为测试模块解析。

### sessionFile

其默认值为 `./.session`

`sessionFile` 是一个用来持久化会话的文件，htte 使用该文件记录测试的请求和响应数据以及测试中断位置

### url

其默认值为 `http://localhost:3000`

`url` 表示所有接口路径的基地址，接口路径为相对路径时会拼接该地址得到完整路径

### type

其默认值为 `json`

`type` 指定默认编码器类型。
编码器设置请求数据的 `Content-Type`, 并编码请求数据。

### timeout

其默认值为 `1000`

`timeout` 设置请求超时时间, 单位为毫秒, 请求超过该时间会自动中断并报错。

### apis

`apis` 是必须字段, 代表一组接口信息。

接口相关信息有: 请求命名, 请求路径（必须），请求方法（默认 get），请求数据编码类型, 超时。

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

### variables

其默认值为 `{}`

`variables` 提供全局变量, 详见[变量]('./variable.zh.md')

### plugins

其默认值为 `[]`

`plugins` 提供插件列表。在 htte 中插件是一个 npm 模块，详见[插件]('./plugin.zh.md')
