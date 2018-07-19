const createReporter = require('../');
const EventEmitter = require('events');
const path = require('path');
const fs = require('fs');

const htte = { baseDir: __dirname };

let emitter = new EventEmitter();

describe('reporter-html', function() {
  afterAll(() => {
    fs.unlinkSync(path.resolve(htte.baseDir, 'reporter.html'));
  });
  test('generate html', function() {
    let units = [mockUnit(1, 'pass'), mockUnit(2, 'skip'), mockUnit(3, 'pass'), mockUnit(4, 'fail')];
    let options = { output: 'reporter.html' };
    createReporter(htte, options)({ emitter });
    emitter.emit('start', { units });
    emitter.emit('done');
    let html = fs.readFileSync(path.resolve(htte.baseDir, options.output), 'utf8');
    expect(html).toMatchSnapshot();
  });
});

function mockUnit(index, state, debug) {
  let unit = {
    session: { state, req: { url: `/p${index}`, body: `req${index}` } },
    ctx: { module: `module${index}`, groups: [`root`, `grp${index}`] },
    describe: `describe${index}`,
    name: `name${index}`,
    metadata: { debug }
  };
  if (state === 'pass') {
    unit.session.res = { body: `res${index}` };
  } else if (state === 'fail') {
    unit.session.err = { parts: ['req', 'body'], message: `err${index}` };
  }
  return unit;
}
