/* eslint-env node, mocha */
'use strict';

const expect = require('chai').expect;
const action = require('../lib/actions/simpleJSONataFilter');

describe('Test filter', () => {
    const msg = {
        body: {
            hello: 'world'
        }
    };

    async function errorCondition(condition) {

        let eventEmitted = false;
        let errorEmitted;
        // eslint-disable-next-line no-unused-vars
        async function onEmit(type, value) {
            if (type && type === 'data') {
                eventEmitted = true;
            }
        }
        const cfg = condition;
        try {
            await action.process.call({
                emit: onEmit
            }, msg, cfg);
        } catch (err) {
            errorEmitted = err;
        }
        expect(eventEmitted).to.equal(false);
        expect(errorEmitted.message).to.equal('Unable to cast value to a number: "world"');
    }

    function filter(condition, passOrFail) {
        it('Running test on expression: ' + condition.expression, async () => {
            let eventEmitted = false;
            // eslint-disable-next-line no-unused-vars
            async function onEmit(type, value) {
                if (type && type === 'data') {
                    eventEmitted = true;
                }
            }
            const cfg = condition;
            await action.process.call({
                emit: onEmit
            }, msg, cfg);
            expect(eventEmitted).to.equal(passOrFail);
        });
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
        expression: '$number(hello) > 5'
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

    it(' should throw error ', async () => {
        await errorCondition(errorCondition1);
    });

});
