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
        function throwError() {
            throw new Error('Error thrown');
        }
        if ((typeof condition.expression) !== 'string') {
            it('This expression should throw an error: ' + condition.expression, (done) => {
                assert.throw(throwError, Error, 'Error thrown');
                done();
            });
        } else {
            it('Running test on expression: ' + condition.expression, (done) => {

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
    }


    const passCondition1 = {
        expression: 'true'
    };
    const passCondition2 = {
        expression: '$not(false)'
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
        expression: '$not(true)'
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


    const errorCondition1 = {
        expression: Number('5')
    };
    const errorCondition2 = {
        expression: 10
    };
    const errorCondition3 = {
        expression: false
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
    });

    describe(' should throw error ', () => {
        filter(errorCondition1, false);
        filter(errorCondition2, false);
        filter(errorCondition3, false);
    });

});
