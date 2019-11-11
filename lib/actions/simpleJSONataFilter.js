'use-strict';

const messages = require('elasticio-node').messages;
const { JsonataTransform } = require('@elastic.io/component-commons-library');

/**
 * This function will be called from the elasticio platform with the following data
 * @param msg incoming message object that contains "body" with payload
 * @param cfg object to retrieve actions configuration values
 */

exports.process = async function simpleJSONataFilter(msg, cfg) {
    const result = JsonataTransform.jsonataTransform(msg, cfg);
    if (result) {
        await this.emit('data', messages.newMessageWithBody({}));
    } else {
        console.log('The message was received but did not meet the condition.');
        if (cfg.assertion) {
            throw new Error('Condition not met...');
        }
    }
};
