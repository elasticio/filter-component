/*eslint no-invalid-this: 0 no-console: 0*/
'use strict';
const vm = require('vm');
const util = require('util');
const moment = require('moment');
const co = require('co');
const rp = require('request-promise');

const scriptCache = {};

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
    }
    this.emit('end');
}

/**
 * This function will return a dynamic metadata model for the reject flow
 * returns a map with taskID=>taskName
 */
function getFlows(cfg) {
    return co(function* gen() {
        console.log('Fetching user flows cfg=%j', cfg);
        const flows = yield rp({
            uri: process.env.ELASTICIO_API_URI + '/v2/flows/',
            auth: {
                user: process.env.ELASTICIO_API_USERNAME,
                pass: process.env.ELASTICIO_API_KEY
            },
            json: true
        });
        console.log('Found %s flows', flows.data.length);
        const result = {};
        flows.data.forEach((flow) => result[flow.id] = flow.attributes.name);
        console.log('Result %j', result);
        return result;
    });
}

module.exports.getFlows = getFlows;
module.exports.process = processAction;
