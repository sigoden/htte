const axios = require('axios');
const qs = require('querystring');
const { completeUrlParams } = require('htte-utils');
const mime = require('mime-types');
const _ = require('lodash');

module.exports = function init(options) {
  return {
    run: function(req) {
      let url = req.url;
      if (!url) {
        return Promise.reject({ err: `req.url must be string` });
      }
      if (/^\//.test(url)) {
        url = options.baseUrl + url;
      }
      try {
        url = completeUrlParams(url, req.params);
      } catch (err) {
        return Promise.reject({ err });
      }
      let method = req.method || 'get';
      let timeout = req.timeout || options.timeout || 30000;
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
            return Promise.reject({ err: `req.type is unsupported` });
        }
      }
      let hrstart = process.hrtime();
      return axios({ url, method, body, headers, timeout })
        .then(function(result) {
          let { status, headers, data } = result;
          let res = { status, headers };
          let type = mime.extension(headers['content-type']);
          try {
            switch (type) {
              case 'json':
                res.body = JSON.parse(data);
                break;
              default:
                throw new Error('');
            }
          } catch (err) {
            return Promise.result(`res.body cannot be unserialized`);
          }
          return res;
        })
        .catch(function(err) {
          if (err.response) {
            let { status, headers, data } = err.response;
            return { status, headers, body: data };
          } else {
            return { err };
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
