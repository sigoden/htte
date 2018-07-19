const ms = require('ms');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const dot = require('dot');
const defaultOptions = {
  output: 'test-report.html'
};

dot.templateSettings.strip = false;

module.exports = function(htte, options = {}) {
  options = Object.assign(defaultOptions, options);
  let outputFile = path.resolve(htte.baseDir, options.output);

  return function({ emitter }) {
    let data = {};
    emitter.on('start', function({ units }) {
      data.units = units;
      data.startedAt = new Date();
    });
    emitter.on('done', function() {
      data.stopedAt = new Date();
      let html = render(tidy(data));
      fs.writeFileSync(outputFile, html);
    });
  };
};

function tidy(data) {
  let { startedAt, stopedAt, units } = data;
  let duration = ms(stopedAt.getTime() - startedAt.getTime());
  let summary = { passes: 0, skips: 0, failures: 0, all: 0 };
  let tidiedUnits = units.filter(unit => unit.session.state).map(function(unit) {
    let { state, err, req, res, duration } = unit.session;
    let { groups, module } = unit.ctx;
    summary.all++;
    switch (unit.session.state) {
      case 'fail':
        summary.failures++;
        break;
      case 'pass':
        summary.passes++;
        break;
      case 'skip':
        summary.skips++;
        break;
    }
    let tidiedUnit = {
      state,
      duration: ms(duration || 0),
      describes: groups.concat(unit.describe).join(' / '),
      module,
      dataJSON: JSON.stringify({ req, res }, null, 2),
      dataYAML: toYAML({ req, res })
    };
    if (err) {
      let { parts, message } = err;
      tidiedUnit.error = { parts: parts.join('->'), message };
    }
    return tidiedUnit;
  });

  return { startedAt, stopedAt, duration, summary, modules: groupBy(tidiedUnits, u => u.module) };
}

function groupBy(array, f) {
  let groups = {};
  array.forEach(function(o) {
    let group = JSON.stringify(f(o));
    groups[group] = groups[group] || [];
    groups[group].push(o);
  });
  return Object.keys(groups).map(function(group) {
    return groups[group];
  });
}

function toYAML(obj) {
  return yaml.safeDump(obj, { skipInvalid: true });
}

function render(data) {
  let templateStr = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8');
  let tempFn = dot.template(templateStr);
  return tempFn(data);
}
