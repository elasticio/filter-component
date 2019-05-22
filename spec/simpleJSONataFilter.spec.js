/* eslint-env node, mocha */
'use strict';

const assert = require('chai').assert;
const jsonata = require('@elastic.io/jsonata-moment');
const action = require('../lib/actions/simpleJSONataFilter');

describe('Test filter', () => {
    const msg = {
        body: {}
    };
    function filter(condition, passOrFail) {
        it(condition.expression, (done) => {
            let eventEmitted = false;
            function onEmit(type, value) {
                if (type && type === 'data') {
                    eventEmitted = true;
                    assert.equal(eventEmitted, passOrFail);
                } else if (type && type === 'end') {
                    assert.equal(eventEmitted, passOrFail);
                    done();
                }
            }

            const cfg = condition;
            action.process.call({
                emit: onEmit
            }, msg, cfg);
        });

    }


    const passCondition1 = {
        expression: 'true'
    };
    const passCondition2 = {
        expression: '!false'
    };
    const passCondition3 = {
        expression: '20 > 5'
    };
    const passCondition4 = {
        expression: '20.4 > 2'
    };
    const passCondition5 = {
        expression: '20.4 > 20'
    };


    const failCondition1 = {
        expression: 'false'
    };
    const failCondition2 = {
        expression: '!true'
    };
    const failCondition3 = {
        expression: '20 > 20'
    };
    const failCondition4 = {
        expression: '20.4 > 20.4'
    };
    const failCondition5 = {
        expression: 'null'
    };
    const failCondition6 = {
        expression: 'undefined'
    };
    const failCondition7 = {
        expression: ''
    };


    describe(' should fire event ', () => {
        filter(passCondition1, true);
        filter(passCondition2, true);
        filter(passCondition3, true);
        filter(passCondition4, true);
        filter(passCondition5, true);
    });

    describe(' should not do anything ', () => {
        filter(failCondition1, false);
        filter(failCondition2, false);
        filter(failCondition3, false);
        filter(failCondition4, false);
        filter(failCondition5, false);
        filter(failCondition6, false);
        filter(failCondition7, false);
    });

});
