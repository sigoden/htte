const path = require('path');
const grpc = require('grpc');
const _ = require('lodash');
const fs = require('fs');
const { ClientError, ValidateError } = require('htte-errors');
const validate = require('./validate');
const { loadProtoFile } = require('./utils');

/**
 * Usage
 * ```yaml
 *  - name: mysrv
 *    pkg: htte-client-grpc
 *    options:
 *      proto: mysrv.proto
 *      package: helloworld
 *      services:
 *      - name: Greeter
 *        url: localhost:50051
 *        credentials:
 *          type: no
 *      - name: Greeter2
 *        url: localhost:50052
 *        ssl:
 *          ca: certs/ca.crt
 *          clientKey: certs/client.key
 *          clientCert: certs/client.crt
 * ```
 */

module.exports = function init(htte, options = {}) {
  if (!validate(options)) {
    throw new ValidateError(`client.${htte.name}.options`, validate.errors);
  }
  let proto;
  try {
    let protoPath = path.resolve(htte.baseDir, options.proto);
    proto = loadProtoFile(protoPath)[options.package];
  } catch (err) {
    throw new Error(`client.${htte.name}: cannot load proto file because of ${err.message}`);
  }
  if (!proto) throw new Error(`client.${htte.name}.options: no package ${options.package}`);
  let rpcs = {};
  options.services.map(function(srv, index) {
    if (!proto[srv.name]) throw new Error(`client.${htte.name}.options[${index}]: no service ${srv.name}`);
    let creds;
    try {
      if (srv.ssl) {
        creds = createSslCredential(htte, srv.ssl);
      } else {
        creds = grpc.credentials.createInsecure();
      }
    } catch (err) {
      throw new Error(`client.${htte.name}.${srv.name}.ssl: ${err.message}`);
    }
    try {
      rpcs[srv.name] = new proto[srv.name](srv.url, creds);
    } catch (err) {
      throw new Error(`client.${htte.name}.${srv.name}: ${err.message}`);
    }
  });
  return function({ req }) {
    if (!req.rpc || !_.isString(req.rpc)) {
      return Promise.reject(new ClientError('value is required and must be string', ['req', 'rpc']));
    }
    let [serviceName, fnName] = req.rpc.split('.');
    if (!rpcs[serviceName]) return Promise.reject(new ClientError(`cannto find rpc ${req.rpc}`, ['req', 'rpc']));
    if (!rpcs[serviceName][fnName]) {
      return Promise.reject(new ClientError(`cannto find rpc ${req.rpc}`, ['req', 'rpc']));
    }
    return new Promise(function(resolve, reject) {
      rpcs[serviceName][fnName](req.body, function(err, response) {
        if (err) return reject(new ClientError(err.message));
        resolve(response);
      });
    });
  };
};

function createSslCredential(htte, certFiles) {
  let certs = [];
  if (certFiles.ca) {
    certs.push(fs.readFileSync(path.resolve(htte.baseDir, certFiles.ca)));
  }
  certs.push(fs.readFileSync(path.resolve(htte.baseDir, certFiles.clientKey)));
  certs.push(fs.readFileSync(path.resolve(htte.baseDir, certFiles.clientCert)));
  return grpc.credentials.createSsl.apply(grpc.credentials, certs);
}
