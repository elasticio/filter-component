'use strict';
const assert = require('chai').assert;
const action = require('../lib/actions/simpleJSONataFilter').process;
const emitter = require('../lib/actions/simpleJSONataFilter').emitter;

describe('Test filter', () => {
    function filter(condition, passOrFail) {
        let msg = {};
        let cfg = condition;
        //let actionObject = action(msg, cfg);
        it('Running tests', (done) => {
            let eventEmitted = false;
            emitter.on('data', () => {
                eventEmitted = true;
            });
            assert.equal(eventEmitted, passOrFail);
            done();
        });

        action(msg, cfg);
    }

    // function filter(condition, passOrFail) {
    //     it(condition, (done) => {
    //        let dataWasCalled = false;
    //
    //        function onEmit(type, value) {
    //            if (type) {
    //                assert.isDefined(value);
    //                dataWasCalled = true;
    //            } else {
    //                assert.isUndefined(value);
    //                assert.equal(dataWasCalled, passOrFail);
    //                done();
    //            }
    //        }
    //
    //        const cfg = {
    //            condition: condition
    //        };
    //
    //         const msg = {};
    //         action.call({
    //            emit: onEmit
    //         }, msg, cfg);
    //     });
    // }
    const passCondition1 = {
        expression: true
    };
    const passCondition2 = {
        expression: !false
    };
    const passCondition3 = {
        expression: 20 > 5
    };
    const passCondition4 = {
        expression: parseFloat('20.4') > 2
    };
    const passCondition5 = {
        expression: 20.4 > 20
    };
    const failCondition1 = {
        expression: false
    };
    const failCondition2 = {
        expression: !true
    };
    const failCondition3 = {
        expression: 20 > 20
    };
    const failCondition4 = {
        expression: 20.4 > 20.4
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
    });

});
