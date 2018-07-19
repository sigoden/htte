# GRPC

该客户端用采用 GRPC 协议与接口服务进行通讯。

> 目前仅支持 GRPC 匿名认证和 SSL/TLS 认证。

## 安装

```
npm install htte-client-grpc -g
```
## 配置

```yaml
 - name: grpc
   pkg: htte-client-grpc
   options:
     proto: grpc.proto # 指定 proto.buf 文件位置
     package: helloworld # 包名
     services: # 列举可用服务
     - name: Greeter  # 服务名
       url: localhost:50051 # 服务监听地址
     - name: Printer
       url: localhost:50052
       ssl:  # 采用 ssl/tls 进行服务认证
         ca: certs/ca.crt # 根证书
         clientKey: certs/client.key # 客户端证书密钥
         clientCert: certs/client.crt # 客户端证书
```

## 用例

```yaml
 - describe: rpc1
   req:
     rpc: Greeter.sayHello # 指定调用方法
     body: # 传入数据
       name: tom
   res:
     body: # GRPC 响应数据
       message: tom
```

```yaml
 - describe: rpc2
   req:
     rpc: Greeter.sayHello
     body:
       name: tom
   res:  # GRPC 错误响应
     error: '3 INVALID_ARGUMENT: ...'
```