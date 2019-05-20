'use-strict';

const messages = require('elasticio-node').messages;
const jsonata = require('@elastic.io/jsonata-moment');

/**
 * This function will be called from the elasticio platform with the following data
 * @param msg incoming message object that contains "body" with payload
 */

exports.process = async function simpleJSONataFilter(msg, cfg) {
    const condition = cfg.expression;
    const compiledCondition = jsonata(condition);
    console.log('Uncompiled condition: ' + condition);
    console.log('Compiling condition = ' + compiledCondition);
    const message = {
        body: {}
    };

    if (condition) {
        await messages.newMessageWithBody(message.body);
    } else {
        console.log('The message was received but did not meet the condition.');
    }
};

