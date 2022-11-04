const vm = require('vm');
const util = require('util');
const moment = require('moment');
const request = require('request-promise');

const scriptCache = {};

let rejectRoutingKey = null;

/**
 * That's how the command should be called to be a webhook
 *
 * @type {string}
 */
const WEBHOOK_COMMAND = 'elasticio/webhook:receive';

/**
 * This functions returns a stepID of the step in the graph
 * where command is 'elasticio/webhook:receive'
 * or it will return null if no webhook step was found in the graph
 *
 * @param graph graph part from flow description
 */
function findWebhookStepID(graph) {
  const step = graph.nodes.find((node) => node.command && node.command.startsWith(WEBHOOK_COMMAND));
  return step ? step.id : null;
}

/**
 * This function will be called every time the component is started
 * to do the necessary initialization
 *
 * @param cfg
 */
async function init(cfg) {
  this.logger.info('Starting initialization...');
  if (!cfg || !cfg.reject) {
    this.logger.info('Initialization not required, no reject is specified');
    return;
  }

  const flowID = cfg.reject;
  this.logger.info('Fetching the flow id=%s', flowID);
  const flow = await request({
    uri: `${process.env.ELASTICIO_API_URI}/v2/flows/${flowID}`,
    auth: {
      user: process.env.ELASTICIO_API_USERNAME,
      pass: process.env.ELASTICIO_API_KEY,
    },
    json: true,
  });
  this.logger.info('Fetched flow=%j', flow);
  const { attributes } = flow.data;
  const { relationships } = flow.data;
  const userID = relationships.user.data.id;
  const { type } = attributes;
  const stepID = findWebhookStepID(attributes.graph);
  if (!stepID) {
    throw new Error('Your reject flow configured in the filter does not '
              + 'start with the Webhook flowID=%s', flowID);
  }
  if (attributes.status !== 'active') {
    this.logger.warn('WARNING: You configured reject flow but this flow '
              + 'is currently inactive, your reject data may potentially be lost'
              + ' flowID=%s status=%s', flowID, attributes.status);
  }
  rejectRoutingKey = `${userID}.${flowID}/${type}.${stepID}.requeue`;
  this.logger.info('Initialization completed');

  // This is actually not needed, but good for unit testing
  // eslint-disable-next-line consistent-return
  return rejectRoutingKey;
}

/**
 * This method will be called from elastic.io platform providing following data
 *
 * @param msg incoming message object that contains ``body`` with payload
 * @param cfg configuration that is account information and configuration field values
 */
async function processAction(msg, cfg) {
  this.logger.info('Starting filter action...');
  const { condition } = cfg;
  const context = Object.assign({
    moment,
  }, msg || {
    body: {},
    attachments: {},
    headers: {},
  });
  if (!scriptCache[condition]) {
    scriptCache[condition] = new vm.Script(util.format('__eio_eval_result = !!(%s)', condition));
  }
  const script = scriptCache[condition];
  script.runInContext(vm.createContext(context));
  // eslint-disable-next-line no-underscore-dangle
  if (context.__eio_eval_result) {
    this.logger.info('Message body did match filter condition');
    await this.emit('data', msg);
  } else {
    this.logger.info('Message body did not match filter condition');
    if (rejectRoutingKey) {
      const rejectFlowID = cfg.reject;
      const that = this;
      const hookURL = (process.env.HOOKS_URL || 'https://in.elastic.io/hook/') + rejectFlowID;
      this.logger.info('Your message will be rejected to flowID=%s');

      try {
        await request({
          method: 'POST',
          uri: hookURL,
          body: msg.body || {},
          json: true,
        });
        that.logger.info('Message sent to reject processing flow');
      } catch (err) {
        that.emit('error', err);
      }
    }
  }
  this.emit('end');
}

/**
 * This function will return a dynamic metadata model for the reject flow
 * returns a map with taskID=>taskName
 */
// eslint-disable-next-line no-unused-vars
async function getFlows(cfg) {
  this.logger.info('Fetching user flows...');
  const flows = await request({
    uri: `${process.env.ELASTICIO_API_URI}/v2/flows/`,
    auth: {
      user: process.env.ELASTICIO_API_USERNAME,
      pass: process.env.ELASTICIO_API_KEY,
    },
    json: true,
  });
  this.logger.info('Found %s flows', flows.data.length);
  const wWebhook = flows.data.filter((flow) => findWebhookStepID(flow.attributes.graph) !== null);
  this.logger.info('Found %s of my flows with webhooks', wWebhook.length);
  const result = {};
  // eslint-disable-next-line no-return-assign
  wWebhook.forEach((flow) => result[flow.id] = flow.attributes.name);
  this.logger.info('Flows was found. Returning result...');
  return result;
}

module.exports.getFlows = getFlows;
module.exports.process = processAction;
module.exports.init = init;
