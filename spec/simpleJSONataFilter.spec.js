'use strict';
const assert = require('chai').assert;
const action = require('../lib/actions/simpleJSONataFilter').process;

describe('Test filter', () => {
    function filter(condition, passOrFail) {
        let msg = {};
        let cfg = {
            expression: condition
        }
        let actionObject = action(msg, cfg);
        it(condition, (done) => {
            let eventEmitted = false;

            if (actionObject.on('data', () => {
                eventEmitted = true;
            })) {
                assert.equal(eventEmitted, passOrFail);
            } else {
                assert.equal(eventEmitted, passOrFail);
            }
        });
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
    const passCondition1 = true;
    const passCondition2 = !false;
    const passCondition3 = 20 > 5;
    const passCondition4 = parseFloat('20.4') > 2;
    const passCondition5 = 20.4 > 20;

    const failCondition1 = false;
    const failCondition2 = !true;
    const failCondition3 = 20 > 20;
    const failCondition4 = 20.4 > 20.4;

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
