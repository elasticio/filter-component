const { expect } = require('chai');
const sinon = require('sinon');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const nock = require('nock');
const bunyan = require('bunyan');

const action = require('../lib/actions/filter');

chai.use(chaiAsPromised);

const self = {
  emit: sinon.spy(),
  logger: bunyan.createLogger({
    name: 'dummy',
  }),
};

describe('Test old filter', () => {
  const msg = {
    body: {
      foo: 20,
      bar: 'foo',
      float: 20.4,
      flString: '20.4',
      iso8601: '1995-12-25',
    },
  };

  afterEach(() => { self.emit.resetHistory(); });

  describe(' should pass ', async () => {
    it('true', async () => {
      await action.process.call(self, msg, { condition: 'true' });
      expect(self.emit.getCall(0).args[0]).to.equal('data');
    });
    it('!false', async () => {
      await action.process.call(self, msg, { condition: '!false' });
      expect(self.emit.getCall(0).args[0]).to.equal('data');
    });
    it('foo > 5', async () => {
      await action.process.call(self, msg, { condition: 'body.foo > 5' });
      expect(self.emit.getCall(0).args[0]).to.equal('data');
    });
    it('parseFloat(flString) > 2', async () => {
      await action.process.call(self, msg, { condition: 'parseFloat(body.flString) > 2' });
      expect(self.emit.getCall(0).args[0]).to.equal('data');
    });
    it('flString > 20', async () => {
      await action.process.call(self, msg, { condition: 'body.flString > 20' });
      expect(self.emit.getCall(0).args[0]).to.equal('data');
    });
    it('moment(iso8601).day() == 1', async () => {
      await action.process.call(self, msg, { condition: 'moment(body.iso8601).day() == 1' });
      expect(self.emit.getCall(0).args[0]).to.equal('data');
    });
  });

  describe(' should fail ', async () => {
    it('false', async () => {
      await action.process.call(self, msg, { condition: 'false' });
      expect(self.emit.getCall(0).args[0]).to.equal('end');
    });
    it('!true', async () => {
      await action.process.call(self, msg, { condition: '!true' });
      expect(self.emit.getCall(0).args[0]).to.equal('end');
    });
    it('foo > 20', async () => {
      await action.process.call(self, msg, { condition: 'body.foo > 20' });
      expect(self.emit.getCall(0).args[0]).to.equal('end');
    });
    it('parseFloat(flString) > 2', async () => {
      await action.process.call(self, msg, { condition: 'parseFloat(body.flString) > 20.4' });
      expect(self.emit.getCall(0).args[0]).to.equal('end');
    });
    it('flString > 20', async () => {
      await action.process.call(self, msg, { condition: 'body.flString > 20.4' });
      expect(self.emit.getCall(0).args[0]).to.equal('end');
    });
  });

  describe(' init ', async () => {
    it(' no reject flow ', async () => {
      const result = await action.init.call(self, {});
      expect(result).to.equal(undefined);
    });

    it(' reject flow ', async () => {
      const cfg = { reject: 'flowId' };
      const api = 'https://www.elastic.io';
      process.env.ELASTICIO_API_URI = api;
      process.env.ELASTICIO_API_USERNAME = 'user';
      process.env.ELASTICIO_API_KEY = 'pass';

      const response = {
        data: {
          attributes: {
            type: 'type',
            graph: {
              nodes: [{ id: 'stepId', command: 'elasticio/webhook:receive' }],
            },
          },
          relationships: {
            user: {
              data: {
                id: 'userId',
              },
            },
          },
        },
      };

      nock(api, { encodedQueryParams: true })
        .get(`/v2/flows/${cfg.reject}`)
        .reply(200, response);

      const result = await action.init.call(self, cfg);
      expect(result).to.equal('userId.flowId/type.stepId.requeue');
    });
  });
});
