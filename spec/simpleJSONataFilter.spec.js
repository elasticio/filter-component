const { expect } = require('chai');
const sinon = require('sinon');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const bunyan = require('bunyan');

const action = require('../lib/actions/simpleJSONataFilter');

chai.use(chaiAsPromised);

const self = {
  emit: sinon.spy(),
  logger: bunyan.createLogger({
    name: 'dummy',
  }),
};

describe('Test filter', () => {
  const simpleMsg = {
    body: {
      hello: 'world',
    },
  };

  afterEach(() => { self.emit.resetHistory(); });

  async function errorCondition(condition) {
    let Error;
    try {
      await action.process.call(self, simpleMsg, condition);
    } catch (error) {
      Error = error;
    }
    expect(Error.message).to.be.equal('Unable to cast value to a number: "world"');
  }

  async function filter(condition, passOrFail) {
    await action.process.call(self, simpleMsg, condition);
    expect(self.emit.calledOnce).to.equal(passOrFail);
  }

  async function passthroughFilter(condition) {
    const passthroughMsg = {
      passthrough: {
        step_2: {
          body: {
            two: 'sample',
          },
        },
        step_1: {
          body: {
            one: 'sample',
          },
        },
      },
      body: {
        step_2: {
          body: {
            two: 'sample',
          },
        },
      },
    };
    await action.process.call(self, passthroughMsg, condition);
    expect(self.emit.calledOnce).to.equal(true);
  }

  async function passthroughError(condition) {
    const passthroughErrorMsg = {
      passthrough: {
        step_2: {
          body: {
            two: 'sample',
          },
        },
        step_1: {
          body: {
            one: 'sample',
          },
        },
      },
      body: {
        elasticio: {},
        step_2: {
          body: {
            two: 'sample',
          },
        },
      },
    };
    let Error;
    try {
      await action.process.call(self, passthroughErrorMsg, condition);
    } catch (error) {
      Error = error;
    }
    expect(Error.message).to.be.equal('elasticio property is reserved             '
        + 'if you are using passthrough functionality');
  }

  async function assertionTest(condition) {
    const msg = {
      passthrough: {
        step_2: {
          body: {
            two: 'sample2',
          },
        },
        step_1: {
          body: {
            one: 'sample1',
          },
        },
      },
      body: {
        step_2: {
          body: {
            two: 'sample2',
          },
        },
      },
    };

    // eslint-disable-next-line no-param-reassign
    condition.assertion = true;
    let Error;
    try {
      await action.process.call(self, msg, condition);
    } catch (error) {
      Error = error;
    }
    expect(Error.message).to.equal(`Condition not met on JSONata expression: ${condition.expression}`);
  }


  const passCondition1 = {
    expression: 'true',
  };
  const passCondition2 = {
    expression: '$not(false)',
  };
  const passCondition3 = {
    expression: '20 > 5',
  };
  const passCondition4 = {
    expression: '20.4 > 2',
  };
  const passCondition5 = {
    expression: '20.4 > 20',
  };


  const failCondition1 = {
    expression: 'false',
  };
  const failCondition2 = {
    expression: '$not(true)',
  };
  const failCondition3 = {
    expression: '20 > 20',
  };
  const failCondition4 = {
    expression: '20.4 > 20.4',
  };
  const failCondition5 = {
    expression: 'null',
  };
  const failCondition6 = {
    expression: 'undefined',
  };


  const errorCondition1 = {
    expression: '$number(hello) > 5',
  };

  const passthroughCondition = {
    expression: 'elasticio.step_1.body.one = elasticio.step_2.body.two',
  };

  describe('Should emit message', async () => {
    it(passCondition1.expression, async () => { await filter(passCondition1, true); });
    it(passCondition2.expression, async () => { await filter(passCondition2, true); });
    it(passCondition3.expression, async () => { await filter(passCondition3, true); });
    it(passCondition4.expression, async () => { await filter(passCondition4, true); });
    it(passCondition5.expression, async () => { await filter(passCondition5, true); });
    it(passthroughCondition.expression, async () => {
      await passthroughFilter(passthroughCondition);
    });
  });

  describe('Should move elasticio variable', async () => {
    it('addMetadataToResponse enabled', async () => {
      const msg = {
        body: {
          data: { some: 'data' },
          elasticio: { id: 'someID' },
        },
      };
      await action.process.call(self, msg, { expression: '0 != 1', addMetadataToResponse: true });
      expect(self.emit.getCall(0).args[1].body).to.deep.equal({
        data: { some: 'data' },
        elasticioMeta: { id: 'someID' },
      });
    });

    it('addMetadataToResponse disabled', async () => {
      const msg = {
        body: {
          data: { some: 'data' },
          elasticio: { id: 'someID' },
        },
      };
      await action.process.call(self, msg, { expression: '0 != 1' });
      expect(self.emit.getCall(0).args[1].body).to.deep.equal({
        data: { some: 'data' },
      });
    });
  });

  describe('Should log message to console', async () => {
    it(passCondition1.expression, async () => { await filter(failCondition1, false); });
    it(failCondition2.expression, async () => { await filter(failCondition2, false); });
    it(failCondition3.expression, async () => { await filter(failCondition3, false); });
    it(failCondition4.expression, async () => { await filter(failCondition4, false); });
    it(failCondition5.expression, async () => { await filter(failCondition5, false); });
    it(failCondition6.expression, async () => { await filter(failCondition6, false); });
  });

  describe('Should throw error', async () => {
    it(errorCondition1.expression, async () => { await errorCondition(errorCondition1); });
    it(passthroughCondition.expression, async () => {
      await passthroughError(passthroughCondition);
    });
    it(passthroughCondition.expression, async () => { await assertionTest(passthroughCondition); });
  });
});
