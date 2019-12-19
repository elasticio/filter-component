/*eslint no-invalid-this: 0 no-console: 0*/
'use strict';
const vm = require('vm');
const util = require('util');
const moment = require('moment');
const co = require('co');
const rp = require('request-promise');

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
function init(cfg) {
    this.logger.info('Initialization started cfg=%j', cfg);
    if (!cfg || !cfg.reject) {
        this.logger.info('Initialization not required, no reject is specified');
        return;
    }
    return co(function* init() {
        const flowID = cfg.reject;
        this.logger.info('Fetching the flow id=%s', flowID);
        const flow = yield rp({
            uri: process.env.ELASTICIO_API_URI + '/v2/flows/' + flowID,
            auth: {
                user: process.env.ELASTICIO_API_USERNAME,
                pass: process.env.ELASTICIO_API_KEY
            },
            json: true
        });
        this.logger.info('Fetched flow=%j', flow);
        const attributes = flow.data.attributes;
        const relationships = flow.data.relationships;
        const userID = relationships.user.data.id;
        const type = attributes.type;
        const stepID = findWebhookStepID(attributes.graph);
        if (!stepID) {
            throw new Error('Your reject flow configured in the filter does not '
                + 'start with the Webhook flowID=%s', flowID);
        }
        if (attributes.status !== 'active') {
            this.logger.info('WARNING: You configured reject flow but this flow '
                + 'is currently inactive, your reject data may potentially be lost'
                + ' flowID=%s status=%s', flowID, attributes.status);
        }
        rejectRoutingKey = `${userID}.${flowID}/${type}.${stepID}.requeue`;
        this.logger.info('Initialization completed rejectRoutingKey=%s', rejectRoutingKey);
        // This is actually not needed, but good for unit testing
        return rejectRoutingKey;
    });
}

/**
 * This method will be called from elastic.io platform providing following data
 *
 * @param msg incoming message object that contains ``body`` with payload
 * @param cfg configuration that is account information and configuration field values
 */
function processAction(msg, cfg) {
    this.logger.info('Action started, cfg=%j msg=%j', cfg, msg);
    const condition = cfg.condition;
    const context = Object.assign({
        moment: moment
    }, msg || {
        body: {},
        attachments: {},
        headers: {}
    });
    if (!scriptCache[condition]) {
        scriptCache[condition] = new vm.Script(util.format('__eio_eval_result = !!(%s)', condition));
    }
    const script = scriptCache[condition];
    script.runInContext(vm.createContext(context));
    if (context.__eio_eval_result) {
        this.logger.info('Message body did match filter condition msg_id=%j', msg.id);
        this.emit('data', msg);
    } else {
        this.logger.info('Message body did not match filter condition msg_id=%j', msg.id);
        if (rejectRoutingKey) {
            const rejectFlowID = cfg.reject;
            const that = this;
            const hookURL = (process.env.HOOKS_URL || 'https://in.elastic.io/hook/') + rejectFlowID;
            this.logger.info('Your message will be rejected to flowID=%s url=', rejectFlowID, hookURL);
            rp({
                method: 'POST',
                uri: hookURL,
                body: msg.body || {},
                json: true
            }).then((response) => {
                this.logger.info('Message sent to flow msg_id=%s flowID=%s response=%j',
                    msg.id, rejectFlowID, response);
            }).catch((err) => {
                that.emit('error', err);
            });
        }
    }
    this.emit('end');
}

/**
 * This function will return a dynamic metadata model for the reject flow
 * returns a map with taskID=>taskName
 */
function getFlows(cfg) {
    return co(function* gen() {
        const userID = process.env.ELASTICIO_USER_ID;
        this.logger.info('Fetching user flows cfg=%j', cfg);
        const flows = yield rp({
            uri: process.env.ELASTICIO_API_URI + '/v2/flows/',
            auth: {
                user: process.env.ELASTICIO_API_USERNAME,
                pass: process.env.ELASTICIO_API_KEY
            },
            json: true
        });
        this.logger.info('Found %s flows', flows.data.length);
        const wWebhook = flows.data.filter((flow) => findWebhookStepID(flow.attributes.graph) !== null);
        this.logger.info('Found %s of my flows with webhooks', wWebhook.length);
        const result = {};
        wWebhook.forEach((flow) => result[flow.id] = flow.attributes.name);
        this.logger.info('Result %j', result);
        return result;
    });
}

module.exports.getFlows = getFlows;
module.exports.process = processAction;
module.exports.init = init;
