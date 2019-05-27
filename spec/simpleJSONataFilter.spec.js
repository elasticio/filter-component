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

    async function errorCondition(condition) {
        let Error;
        try {
            await action.process(msg, condition);
        } catch (error) {
            Error = error;
        }
        expect(Error.message).to.be.equal('Unable to cast value to a number: "world"');
    }

    async function filter(condition, passOrFail) {
        const spy = sinon.spy();
        await action.process.call({
            emit: spy
        }, msg, condition);
        expect(spy.calledOnce).to.equal(passOrFail);
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


    it(' should fire event ', async () => {
        await filter(passCondition1, true);
        await filter(passCondition2, true);
        await filter(passCondition3, true);
        await filter(passCondition4, true);
        await filter(passCondition5, true);
    });

    it(' should not do anything ', async () => {
        await filter(failCondition1, false);
        await filter(failCondition2, false);
        await filter(failCondition3, false);
        await filter(failCondition4, false);
        await filter(failCondition5, false);
        await filter(failCondition6, false);
    });

    it(' should throw error ', async () => {
        await errorCondition(errorCondition1);
    });

});
