const initClient = require('../');
const { ClientError } = require('htte-errors');

const htte = {}

jest.mock('axios', () => jest.fn().mockResolvedValue({ status: 200, headers: {}, data: {key: 'v'}}));

axios = require('axios');

afterEach(() => jest.clearAllMocks());

describe('http', function() {
  test('check req', function(done) {
    initClient(htte)({req: {}, res: {}}).catch(err => {
      expectClientError(err, 'is required', ['req', 'url']);
      done();
    });
  });
  test('req.url auto translate to absolute', function(done) {
    let baseUrl = 'http://x.com';
    initClient(htte, { baseUrl })({req: { url: '/path'}, res: {}}).then(res => {
      expect(axios.mock.calls[0][0].url).toBe(baseUrl + '/path');
      done();
    });
  });
  test('req.method will be "get" if absent', function(done) {
    initClient(htte, {})({req: { url: 'http://x.com/api'}, res: {}}).then(res => {
      expect(axios.mock.calls[0][0].method).toBe('get');
      done();
    });
  });
  test('req.params will be merged into the url', function(done) {
    initClient(htte, {})({req: { url: 'http://x.com/api/{id}', params: { id: 3}}, res: {}}).then(res => {
      expect(axios.mock.calls[0][0].url).toBe('http://x.com/api/3');
      done();
    });
  });
  test('req.query will be appeded to url', function(done) {
    initClient(htte, {})({req: { url: 'http://x.com/api', query: {size: 10}, type:'json'}, res: {}}).then(res => {
      expect(axios.mock.calls[0][0].url).toBe('http://x.com/api?size=10');
      done();
    });
  });
  test('req.headers[Content-Type] will derive from req.type', function(done) {
    initClient(htte, {})({req: { url: 'http://x.com/api', body: {v: 3}, type:'json'}, res: {}}).then(res => {
      expect(axios.mock.calls[0][0].headers['Content-Type']).toBe('application/json; charset=utf-8');
      done();
    });
  });
  test('res.headers will be filterd by expected headers', function(done) {
    axios.mockResolvedValue({ status: 200, headers: { a: 3, b: 4 } });
    initClient(htte, {})({req: { url: 'http://x.com/api'}, res: { headers: {a: 'v'}}}).then(res => {
      expect(res.headers).toEqual({ a: 3});
      done();
    });
  });
  test('wrap non-2xx response as resolved other than rejected', function(done) {
    axios.mockRejectedValue({ response: { status: 400, headers: { a: 3, b: 4 }, data: { key: 'v'} }});
    initClient(htte, {})({req: { url: 'http://x.com/api'}, res: {}}).then(res => {
      expect(res).toEqual({ status: 400, body: { key: 'v'} });
      done();
    });
  })
})

function expectClientError(err, message, parts = []) {
  expect(err).toBeInstanceOf(ClientError);
  expect(err.message).toBe(message)
  expect(err.parts).toEqual(parts)
}