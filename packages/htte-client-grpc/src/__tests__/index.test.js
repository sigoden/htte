const grpc = require('grpc');
const path = require('path');
const fs = require('fs');

const createClient = require('../');
const { loadProtoFile } = require('../utils');

const htte = { baseDir: path.resolve(__dirname, './fixtures'), name: 'grpc' };

const proto = loadProtoFile(htte.baseDir + '/mysrv.proto').helloworld;
const protoLoader = require('@grpc/proto-loader');

describe('grpc', function() {
  let server = new grpc.Server();
  beforeAll(function(done) {
    server.addService(proto.Greeter.service, {
      sayHello: (call, callback) => {
        let name = call.request.name;
        if (/error/.test(name)) {
          callback({ code: grpc.status.INVALID_ARGUMENT, message: '...' });
          return;
        }
        callback(null, { message: call.request.name });
      }
    });
    server.bind('0.0.0.0:50051', grpc.ServerCredentials.createInsecure());
    server.start();
    setTimeout(done, 100);
  });

  afterAll(function(done) {
    server.forceShutdown();
    setTimeout(done, 100);
  });
  test('validate options', function() {
    expect(() => createClient(htte, require('./fixtures/options.invalid.json')))
      .toThrow(`validate client.grpc.options throw errors:
   should have required property 'package'`);
  });
  test('req & res', function(done) {
    let client = createClient(htte, require('./fixtures/options.json'));
    client({ req: { rpc: 'Greeter.sayHello', body: { name: 'foo' } } }).then(res => {
      expect(res.body.message).toBe('foo');
      done();
    });
  });
  test('rpc returns error ', function(done) {
    let client = createClient(htte, require('./fixtures/options.json'));
    client({ req: { rpc: 'Greeter.sayHello', body: { name: 'error' } } }).then(res => {
      expect(res.error).toBe('3 INVALID_ARGUMENT: ...');
      done();
    });
  });
});

describe('grpc ssl', function() {
  let server = new grpc.Server();
  beforeAll(function(done) {
    server.addService(proto.Greeter.service, {
      sayHello: (call, callback) => {
        callback(null, { message: call.request.name });
      }
    });
    let ca = fs.readFileSync(path.resolve(__dirname, './fixtures/certs/ca.crt'));
    let serverKey = fs.readFileSync(path.resolve(__dirname, './fixtures/certs/server.key'));
    let serverCert = fs.readFileSync(path.resolve(__dirname, './fixtures/certs/server.crt'));
    let creds = grpc.ServerCredentials.createSsl(ca, [{ cert_chain: serverCert, private_key: serverKey }]);
    server.bind('0.0.0.0:50052', creds);
    server.start();
    setTimeout(done, 100);
  });

  afterAll(function(done) {
    server.forceShutdown();
    setTimeout(done, 100);
  });
  test('req & res', function(done) {
    let client = createClient(htte, require('./fixtures/options.ssl.json'));
    client({ req: { rpc: 'Greeter.sayHello', body: { name: 'foo' } } }).then(res => {
      expect(res.body.message).toBe('foo');
      done();
    });
  });
});
