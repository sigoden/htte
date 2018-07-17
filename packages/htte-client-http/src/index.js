const axios = require('axios');
const qs = require('querystring');
const { completeUrlParams } = require('htte-utils');
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

module.exports = function init(htte, options = {}) {
  options = _.merge(defaultOptions, options);
  return function({ req, res }) {
    try {
      checkReqproperties(reqChecks, req);
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
          return Promise.reject(new ClientError('unsupported', ['req', 'type']));
      }
    }
    let clientData = { url, method, data: body, headers, timeout };
    return axios(clientData)
      .catch(function(err) {
        if (err.response) {
          let { status, headers, data } = err.response;
          return { status, headers, data };
        }
        throw new ClientError(err.message);
      })
      .then(function(result) {
        let { status, headers, data } = result;
        let actualRes = { status, body: data };
        if (res) {
          if (utils.type(res.headers) === 'object') {
            actualRes.headers = _.pick(headers, Object.keys(res.headers));
          }
        }
        return actualRes;
      })
      .catch(function(err) {
        if (!(err instanceof ClientError)) {
          err = new ClientError(err.message);
        }
        return Promise.reject(err);
      });
  };
};

function checkReqproperties(checks, req) {
  for (let check of checks) {
    let value = req[check.key];
    if (_.isUndefined(value)) {
      if (check.required) {
        debugger;
        throw new ClientError('required', ['req', check.key]);
      }
      continue;
    }
    if (utils.type(value) !== check.type) {
      throw new ClientError(`must be ${check.type}`, ['req', check.key]);
    }
  }
}
