'use-strict';

const messages = require('elasticio-node').messages;
const jsonata = require('@elastic.io/jsonata-moment');
const PASSTHROUGH_BODY_PROPERTY = 'elasticio';

/**
 * This function will be called from the elasticio platform with the following data
 * @param msg incoming message object that contains "body" with payload
 * @param cfg object to retrieve actions configuration values
 */

exports.process = async function simpleJSONataFilter(msg, cfg) {
    const condition = cfg.expression;
    const compiledCondition = jsonata(condition);
    handlePassthrough(msg);
    const result = compiledCondition.evaluate(msg.body);
    if (result) {
        await this.emit('data', messages.newMessageWithBody({}));
    } else {
        // eslint-disable-next-line no-console
        console.log('The message was received but did not meet the condition.');
    }
};

function handlePassthrough(message) {
    if (message.passthrough && Object.keys(message.passthrough)) {
        if (PASSTHROUGH_BODY_PROPERTY in message.body) {
            throw new Error(`${PASSTHROUGH_BODY_PROPERTY} property is reserved \
            if you are using passthrough functionality`);
        }

        message.body.elasticio = {};
        Object.assign(message.body.elasticio, message.passthrough);
    }
    return message;
}
