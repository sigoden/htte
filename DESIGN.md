## 目标

### 抽离 client 到扩展
htte v0.3 主要目标时 RESTful API 的自动化测试，但在 v0.4 时，我希望 htte 不仅仅局限在 RESTful API 上。
htte v0.4 抽离出一个 client 对象，专门用来处理远程请求。使用 htt-client 处理 http 方面的请求和相应， 使用 grpc-client 处理 grpc 方面的请求。htte 核心将变得更小更轻。

### 优化模块加载
htte v0.3 通过模块依赖和文件名顺序自动加载目录中所有模块，这样看似简便了，实际上让问题更复杂且也不灵活，用户往往很能搞清楚具体的顺序是什么。
htte v0.4 将在配置文件中指定需要加载的模块，依据指定模块的顺序作为模块加载顺序。

### 信息打印
htte v0.3 中不管时验证信息还是执行信息，都只有一种方式显示，而且这部分代码耦合到其它所有模块中，不管是开发上还是使用上体验都较差。
htte v0.4 将优化这里信息打印模块，提供统一的接口从更个部分收集信息，在提供扩展灵活输出这些信息，可以打印到终端，也可以做报告并以 H5 显示输出。

### 配置选项整理
```yaml
session: # 指定会话文件保存位置
reporters:
- name: cli
  pkg: pkg-name
  options:
modules: # 本次测试需要加载的模块文件
- foo # 加载 foo.yaml 文件，模块变量名 foo
- foo/bar # 加载 foo/bar.yaml 文件，模块变量名 foobar
plugins: # 插件配置
- pkg: pkg-name # 模块包名，模块文件位置
  options:  # 模块选项
clients:
- name: http 
  pkg: pkg-name # 模块包名，模块文件位置
  options:
exports:
    login:
        client: http
        req:
            method: post
            uri: /login
    auth:
        client: grpc
        req:
            rpc: auth
```

### 模块选项整理
```yaml
- describe: 功能模块
  exports:
    auth1:
        req:
            headers: !$concat [ Bearer, !$query $$auth.loginFoo.res.body.token ]
    auth2:
        req:
            headers: !$concat [ Bearer, !$query $$auth.loginBaz.res.body.token ]
  units:
  - describe: 接口1
    name: ep1
    metadata: # 元标签
        requires: [ login, auth1 ]
        skip:   # 跳过该测试
        pause:  # 运行当前测试后停止执行
        debug:  # 打印本条测试详情
    req:
        headers:
        query:
        body:
    res:
        status:
        headers:
        body:
  - describe: RPC 接口2
    metadata: # 元标签
        requires: auth
        skip:   # 跳过该测试
        pause:  # 运行当前测试后停止执行
        debug:  # 打印本条测试详情
    req:
        body:
    res:
        body:
```

### 推荐目录结构
```
├── clients        # 可用客户端
├── htte.sess      # 会话文件
├── htte.yaml      # 配置文件
├── htte.prod.yaml # 配置补丁文件
├── modules        # 测试模块文件
├── plugins        # 插件
└── reporters      # 可以报告输出
```