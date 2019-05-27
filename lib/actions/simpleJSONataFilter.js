'use-strict';

const messages = require('elasticio-node').messages;
const jsonata = require('@elastic.io/jsonata-moment');

/**
 * This function will be called from the elasticio platform with the following data
 * @param msg incoming message object that contains "body" with payload
 * @param cfg object to retrieve actions configuration values
 */

exports.process = async function simpleJSONataFilter(msg, cfg) {
    const condition = cfg.expression;
    const compiledCondition = jsonata(condition);
    const result = compiledCondition.evaluate(msg.body);
    if (result) {
        await this.emit('data', messages.newMessageWithBody({}));
    } else {
        // eslint-disable-next-line no-console
        console.log('The message was received but did not meet the condition.');
    }
};
