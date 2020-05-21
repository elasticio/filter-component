const { messages } = require('elasticio-node');
const { JsonataTransform } = require('@elastic.io/component-commons-library');

/**
 * This function will be called from the elasticio platform with the following data
 * @param msg incoming message object that contains "body" with payload
 * @param cfg object to retrieve actions configuration values
 */

exports.process = async function simpleJSONataFilter(msg, cfg) {
  const result = JsonataTransform.jsonataTransform(msg, cfg, this);
  if (result) {
    await this.emit('data', messages.newMessageWithBody(msg.body));
  } else {
    this.logger.info('The message was received but did not meet the condition.');
    if (cfg.assertion) {
      throw new Error(`Condition not met on JSONata expression: ${cfg.expression}`);
    }
  }
};
