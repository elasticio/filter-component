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
 * That's how the message header has to be called
 * so that it will be re-routed to the specific routing key
 * @type {string}
 */
const HEADER_ROUTING_KEY = 'X-EIO-Routing-Key';

/**
 * That's the key to override the taskID header
 * that will be set on the rejected message
 *
 * @type {string}
 */
const HEADER_FLOW_ID_KEY = 'X-EIO-Flow-ID'.toLowerCase();

/**
 * This functions returns a stepID of the step in the graph
 * where command is 'elasticio/webhook:receive'
 * or it will return null if no webhook step was found in the graph
 *
 * @param graph graph part from flow description
 */
function findWebhookStepID(graph) {
    const step = graph.nodes.find((node) => node.command === WEBHOOK_COMMAND);
    return step ? step.id : null;
}

/**
 * This function will be called every time the component is started
 * to do the necessary initialization
 *
 * @param cfg
 */
function init(cfg) {
    console.log('Initialization started cfg=%j', cfg);
    if (!cfg || !cfg.reject) {
        console.log('Initialization not required, no reject is specified');
        return;
    }
    return co(function* init() {
        const flowID = cfg.reject;
        console.log('Fetching the flow id=%s', flowID);
        const flow = yield rp({
            uri: process.env.ELASTICIO_API_URI + '/v2/flows/' + flowID,
            auth: {
                user: process.env.ELASTICIO_API_USERNAME,
                pass: process.env.ELASTICIO_API_KEY
            },
            json: true
        });
        console.log('Fetched flow=%j', flow);
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
            console.log('WARNING: You configured reject flow but this flow '
                + 'is currently inactive, your reject data may potentially be lost'
                + ' flowID=%s status=%s', flowID, attributes.status);
        }
        rejectRoutingKey = `${userID}.${flowID}/${type}.${stepID}.requeue`;
        console.log('Initialization completed rejectRoutingKey=%s', rejectRoutingKey);
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
    console.log('Action started, cfg=%j msg=%j', cfg, msg);
    const condition = cfg.condition;
    const context = Object.assign({
        moment: moment
    }, msg.body || {});
    if (!scriptCache[condition]) {
        scriptCache[condition] = new vm.Script(util.format('__eio_eval_result = !!(%s)', condition));
    }
    const script = scriptCache[condition];
    script.runInContext(vm.createContext(context));
    if (context.__eio_eval_result) {
        console.log('Message body did match filter condition msg_id=%j', msg.id);
        this.emit('data', msg);
    } else {
        console.log('Message body did not match filter condition msg_id=%j', msg.id);
        if (rejectRoutingKey) {
            const rejectFlowID = cfg.reject;
            const that = this;
            console.log('Your message will be rejected to flowID=%s', rejectFlowID);
            if (!process.env.HOOKS_URL) {
                console.log('HOOKS_URL environment variable is not set, please set it.')
            } else {
                rp({
                    method: 'POST',
                    uri: process.env.HOOKS_URL + rejectFlowID,
                    body: msg.body || {},
                    json:true
                }).then(function(response) {
                    console.log('Message sent to flow msg_id=%s flowID=%s response=%j', msg.id, rejectFlowID, response);
                }).catch(function(err) {
                    that.emit('error', err);
                });
            }
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
        console.log('Fetching user flows cfg=%j userID=%s', cfg, userID);
        const flows = yield rp({
            uri: process.env.ELASTICIO_API_URI + '/v2/flows/',
            auth: {
                user: process.env.ELASTICIO_API_USERNAME,
                pass: process.env.ELASTICIO_API_KEY
            },
            json: true
        });
        console.log('Found %s flows', flows.data.length);
        const myFlows = flows.data
            .filter((flow) => flow.relationships.user.data.id === userID);
        console.log('Found %s flows that belongs to current user', myFlows.length);
        const wWebhook = myFlows.filter((flow) => findWebhookStepID(flow.attributes.graph) !== null);
        console.log('Found %s of my flows with webhooks', wWebhook.length);
        const result = {};
        wWebhook.forEach((flow) => result[flow.id] = flow.attributes.name);
        console.log('Result %j', result);
        return result;
    });
}

module.exports.getFlows = getFlows;
module.exports.process = processAction;
module.exports.init = init;
