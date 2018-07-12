const axios = require('axios');
const qs = require('querystring');
const { type, completeUrlParams } = require('htte-utils');
const mime = require('mime-types');
const _ = require('lodash');
const { ClientError } = require('htte-errors');
const utils = require('htte-utils');

const defaultOptions = {
  type: 'json',
  timeout: 30000
};

const reqChecks = [
  { key: 'url', type: 'string', required: true },
  { key: 'method', type: 'string', required: false },
  { key: 'query', type: 'object', required: false },
  { key: 'timeout', type: 'number', required: false },
  { key: 'params', type: 'object', required: false },
  { key: 'headers', type: 'object', required: false }
];

module.exports = function init(htte, options) {
  options = _.merge(defaultOptions, options);
  return {
    run: function(req, expectedRes, saveClientData) {
      try {
        checkReq(reqChecks, req);
      } catch (err) {
        return Promise.reject(err);
      }
      let url = req.url;
      if (/^\//.test(url)) {
        url = options.baseUrl + url;
      }
      try {
        url = completeUrlParams(url, req.params);
      } catch (err) {
        return Promise.reject(new ClientError(err.message, ['req', 'params']));
      }
      let method = (req.method || 'get').toLowerCase();
      let timeout = req.timeout || options.timeout;
      if (req.query) url += '?' + qs.stringify(req.query);
      let headers = req.headers || {};
      let body;
      if (req.body) {
        switch (req.type || options.type) {
          case 'json':
            body = JSON.stringify(req.body);
            headers['Content-Type'] = 'application/json; charset=utf-8';
            break;
          default:
            return Promise.reject(new ClientError('is unsupported', ['req', 'type']));
        }
      }
      let hrstart = process.hrtime();
      let clientData = { url, method, data: body, headers, timeout };
      saveClientData(clientData);
      return axios(clientData)
        .then(function(result) {
          let { status, headers, data } = result;
          let res = { status };
          let type = mime.extension(headers['content-type']);
          switch (type) {
            case 'json':
              res.body = data;
              break;
            default:
              res.body = data;
          }
          if (expectedRes) {
            if (utils.type(expectedRes.headers) === 'object') {
              res.headers = _.pick(headers, Object.keys(expectedRes.headers));
            }
          }
          return res;
        })
        .catch(function(err) {
          if (err.response) {
            let { status, headers, data } = err.response;
            return { status, headers, body: data };
          } else {
            if (!err instanceof ClientError) {
              err = new ClientError(err.message);
            }
            return Promise.reject(err);
          }
        })
        .then(function(res) {
          let time = process.hrtime(hrstart)[1] / 1000000;
          res.time = time;
          return res;
        });
    }
  };
};

function checkReq(checks, req) {
  for (let check of checks) {
    let value = req[check.key];
    if (_.isUndefined(value)) {
      if (check.required) {
        throw new ClientError('is required', ['req', check.key]);
      }
      continue;
    }
    if (utils.type(value) !== check.type) {
      throw new ClientError(`must be ${check.type}`, ['req', check.key]);
    }
  }
}
