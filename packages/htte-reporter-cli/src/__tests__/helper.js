function mockUnit(index, state, debug) {
  let unit = {
    session: { state, req: { url: `/p${index}`, body: `req${index}` } },
    ctx: { module: `module${index}`, groups: [`root`, `grp${index}`], enterGroupLevel: index === 1 ? 2 : 1 },
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

exports.mockUnit = mockUnit;
