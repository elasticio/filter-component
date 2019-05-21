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

    describe(' should fire event ', () => {
        filter('true', true);
        filter('!false', true);
        filter('body.foo > 5', true);
        filter('parseFloat(body.flString) > 2', true);
        filter('body.flString > 20', true);
        filter('moment(body.iso8601).day() == 1', true);
    });

    describe(' should not do anything ', () => {
        filter('false', false);
        filter('!true', false);
        filter('body.foo > 20', false);
        filter('body.float > 20.4', false);
    });

});
