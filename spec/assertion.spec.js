/* eslint-env node, mocha */
'use strict';

const action = require('../lib/actions/assertion');
const expect = require('chai').expect;

describe('Assertion test', () => {
    it('should handle passthrough but throw an error when condition not met', async () => {
        let Error;
        const passthroughCondition = {
            expression: 'elasticio.step_1.body.one = elasticio.step_2.body.two'
        };
        const msg = {
            passthrough: {
                step_2: {
                    body: {
                        two: 'sample2'
                    }
                },
                step_1: {
                    body: {
                        one: 'sample1'
                    }
                }
            },
            body: {
                step_2: {
                    body: {
                        two: 'sample2'
                    }
                }
            }
        };
        try {
            await action.process(msg, passthroughCondition);
        } catch (error) {
            Error = error;
        }
        expect(Error.message).to.equal('Condition not met...');
    });
});
