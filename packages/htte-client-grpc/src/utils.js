const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');

exports.loadProtoFile = function(file, options) {
  let packageDefinition = protoLoader.loadSync(file, options);
  return grpc.loadPackageDefinition(packageDefinition);
};
