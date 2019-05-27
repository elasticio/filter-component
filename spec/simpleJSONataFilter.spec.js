/* eslint-env node, mocha */
'use strict';

const expect = require('chai').expect;
const action = require('../lib/actions/simpleJSONataFilter');
const sinon = require('sinon');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

describe('Test filter', () => {
    const msg = {
        body: {
            hello: 'world'
        }
    };

    function errorCondition(condition) {
        it('Running test on error condition: ' + condition.expression, async () => {
            let Error;
            try {
                await action.process(msg, condition);
            } catch (error) {
                Error = error;
            }
            expect(Error.message).to.be.equal('Unable to cast value to a number: "world"');
        });
    }

    function filter(condition, passOrFail) {
        it('Running test on pass/fail expression: ' + condition.expression, async () => {
            const spy = sinon.spy();
            await action.process.call({
                emit: spy
            }, msg, condition);
            expect(spy.calledOnce).to.equal(passOrFail);

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

    describe(' should throw error ', () => {
        errorCondition(errorCondition1);
    });

});
