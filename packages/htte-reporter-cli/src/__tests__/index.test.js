const createReporter = require('../');
const EventEmitter = require('events');
const utils = require('../utils');

const htte = {};
const options = {};

utils.useColors = false;
utils.epilogue = jest.fn();

let emitter = new EventEmitter();
let stdoutWrite = (process.stdout.write = jest.fn());
utils.spinnerMarks = '◵';

afterEach(() => jest.clearAllMocks());

describe('reporter', function() {
  let reporter = createReporter(htte, options)({ emitter });

  test('@start', function() {
    emitter.emit('start', { units: [], tdd: false });
    expect(stdoutWrite.mock.calls.join('')).toBe('\n');
  });

  test('@enterGroup', function() {
    let unit = mockUnit(1, 'pass');
    emitter.emit('enterGroup', { unit });
    expect(stdoutWrite.mock.calls.join('')).toBe(`root\n  grp1\n`);
  });

  test('@skipUnit', function() {
    let unit = mockUnit(1, 'skip');
    emitter.emit('skipUnit', { unit });
    expect(stdoutWrite.mock.calls.join('')).toBe(`    •  describe1\n`);
  });

  test('@runUnit & doneUnit', function(done) {
    let unit = mockUnit(1, 'pass');
    emitter.emit('runUnit', { unit });
    setTimeout(() => {
      expect(stdoutWrite.mock.calls[1][0]).toBe(`    ◵  describe1`);
      emitter.emit('doneUnit');
      expect(stdoutWrite.mock.calls.slice(3).join('')).toBe(`    ✔  describe1\n`);
      done();
    }, utils.spinnerInterval + 1);
  });

  test('@runUnit & doneUnit slow', function(done) {
    let unit = mockUnit(1, 'pass');
    unit.session.duration = 10000;
    emitter.emit('runUnit', { unit });
    setTimeout(() => {
      expect(stdoutWrite.mock.calls[1][0]).toBe(`    ◵  describe1`);
      emitter.emit('doneUnit');
      expect(stdoutWrite.mock.calls.slice(3).join('')).toBe(`    ✔  describe1 (10s)\n`);
      done();
    }, utils.spinnerInterval + 1);
  });

  test('@runUnit & errorUnit', function(done) {
    let unit = mockUnit(1, 'fail');
    emitter.emit('runUnit', { unit });
    setTimeout(() => {
      expect(stdoutWrite.mock.calls[1][0]).toBe(`    ◵  describe1`);
      emitter.emit('errorUnit');
      expect(stdoutWrite.mock.calls.slice(3).join('')).toBe(`    1) describe1\n`);
      done();
    }, utils.spinnerInterval + 1);
  });

  test('@done', function() {
    let args = {};
    emitter.emit('done', args);
    expect(utils.epilogue).toHaveBeenCalledWith(args);
  });

  test('auto enable metadata.debug of last failed unit when tdd', function() {
    let units = [mockUnit(1, 'pass'), mockUnit(2, 'fail')];
    emitter.emit('start', { units, tdd: true });
    emitter.emit('runUnit', { unit: units[1] });
    setTimeout(() => {
      emitter.emit('errorUnit');
      expect(units[1].metadata.debug).toBe(true);
      done();
    }, utils.spinnerInterval + 1);
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
