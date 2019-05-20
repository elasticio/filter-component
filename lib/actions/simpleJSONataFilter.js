'use-strict';

/**
 * This function will be called from the elasticio platform with the following data
 * @param msg incoming message object that contains "body" with payload
 */

exports.process = async function simpleJSONataFilter(msg, cfg) {
    const condition = cfg.expression;
    const message = {
        body: {}
    };

    if (condition) {
        await this.emit('data', message);
    } else {
        console.log('The message was received but did not meet the condition.');
    }
};
