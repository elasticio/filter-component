/* eslint-env node, mocha */
'use strict';
const assert = require('chai').assert;
const action = require('../lib/actions/filter').process;

describe('Test filter', () => {
    const msg = {
        body: {
            foo: 20,
            bar: 'foo',
            float: 20.4,
            flString: '20.4',
            iso8601: '1995-12-25'
        }
    };

    function filter(condition, passOrFail) {
        it(condition, (done) => {
            let dataWasCalled = false;

            function onEmit(type, value) {
                if (type && type === 'data') {
                    assert.isDefined(value);
                    dataWasCalled = true;
                } else if (type && type === 'end') {
                    assert.isUndefined(value);
                    assert.equal(dataWasCalled, passOrFail);
                    done();
                }
            }

            const cfg = {
                condition: condition
            };
            action.call({
                emit: onEmit
            }, msg, cfg);
        });
    }

    describe(' should pass ', () => {
        filter('true', true);
        filter('!false', true);
        filter('foo > 5', true);
        filter('parseFloat(flString) > 2', true);
        filter('flString > 20', true);
        filter('moment(iso8601).day() == 1', true);
    });

    describe(' should fail ', () => {
        filter('false', false);
        filter('!true', false);
        filter('foo > 20', false);
        filter('float > 20.4', false);
        filter('float > 20.4', false);
    });

});
