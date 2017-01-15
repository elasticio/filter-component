/*eslint no-invalid-this: 0 no-console: 0*/
'use strict';
const vm = require('vm');
const util = require('util');

let script = null;

/**
 * This method will be called from elastic.io platform providing following data
 *
 * @param msg incoming message object that contains ``body`` with payload
 * @param cfg configuration that is account information and configuration field values
 */
function processAction(msg, cfg) {
  console.log('Action started, cfg=%j msg=%j', cfg, msg);
  const condition = cfg.condition;
  const context = Object.assign({}, msg.body || {});

  if (!script) {
    script = new vm.Script(util.format('const __eio_eval_result = !!(%s)', condition));
  }
  script.runInContext(vm.createContext(context));
  if (context.__eio_eval_result) {
    this.emit('data', msg);
  } else {
    console.log('Message body not match filter condition body=%j', msg.body)
  }
  this.emit('end');
}

module.exports.process = processAction;
