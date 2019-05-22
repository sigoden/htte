const createReporter = require('../');
const EventEmitter = require('events');
const utils = require('../utils');
const { mockUnit } = require('./helper');

const htte = {};
const options = {};

utils.useColors = false;
utils.epilogue = jest.fn();

let emitter = new EventEmitter();
let stdoutWrite = (process.stdout.write = jest.fn());
utils.spinnerMarks = '◵';

afterEach(() => jest.clearAllMocks());

describe('reporter', function() {
  createReporter(htte, options)({ emitter });

  test('@start', function() {
    emitter.emit('start', { units: [], tdd: false });
    expect(stdoutWrite.mock.calls.join('')).toMatchSnapshot();
  });

  test('@enterGroup', function() {
    let unit = mockUnit(1, 'pass');
    emitter.emit('enterGroup', { unit });
    expect(stdoutWrite.mock.calls.join('')).toMatchSnapshot();
  });

  test('@skipUnit', function() {
    let unit = mockUnit(1, 'skip');
    emitter.emit('skipUnit', { unit });
    expect(stdoutWrite.mock.calls.join('')).toMatchSnapshot();
  });

  test('@runUnit & doneUnit', function(done) {
    let unit = mockUnit(1, 'pass');
    emitter.emit('runUnit', { unit });
    setTimeout(() => {
      expect(stdoutWrite.mock.calls[1][0]).toBe(`    ◵  describe1`);
      emitter.emit('doneUnit');
      expect(stdoutWrite.mock.calls.slice(3).join('')).toMatchSnapshot();
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
      expect(stdoutWrite.mock.calls.slice(3).join('')).toMatchSnapshot();
      done();
    }, utils.spinnerInterval + 1);
  });

  test('@runUnit & errorUnit', function(done) {
    let unit = mockUnit(1, 'fail');
    emitter.emit('runUnit', { unit });
    setTimeout(() => {
      expect(stdoutWrite.mock.calls[1][0]).toMatchSnapshot();
      emitter.emit('errorUnit');
      expect(stdoutWrite.mock.calls.slice(3).join('')).toMatchSnapshot();
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
