# grpc client for htte

## config

```yaml
 - name: mysrv
   pkg: htte-client-grpc
   options:
     proto: mysrv.proto
     package: helloworld
     services:
     - name: Greeter
       url: localhost:50051
     - name: Printer
       url: localhost:50052
       ssl:
         ca: certs/ca.crt
         clientKey: certs/client.key
         clientCert: certs/client.crt
```

## unit

```yaml
 - describe: rpc1
   req:
     rpc: Greeter.sayHello
     body:
       name: tom
    res:
     body:
       message: tom
```

```yaml
 - describe: rpc2
   req:
     rpc: Greeter.sayHello
     body:
       name: tom
    res:
     error: '3 INVALID_ARGUMENT: ...'
```