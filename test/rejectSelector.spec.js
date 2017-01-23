/* eslint-env node, mocha */
'use strict';
const assert = require('chai').assert;
const action = require('../lib/actions/filter').getFlows;
const nock = require('nock');

describe('Given the getFlows metamodel selection', function () {
    before(function () {
        process.env.ELASTICIO_API_URI = 'http://foo.com';
        process.env.ELASTICIO_API_USERNAME = 'test-user';
        process.env.ELASTICIO_API_KEY = 'test-key';
        process.env.ELASTICIO_USER_ID = '55b62973e3831b0800000001';
    });
    describe('and API responded OK', function () {
        let scope;
        before(() => scope = nock('http://foo.com').get('/v2/flows/').basicAuth({
            user: 'test-user',
            pass: 'test-key'
        }).reply(200, require('./data/flows.json')));
        it('should return list of tasks', function () {
            return action({}).then((result) => {
                assert.isOk(scope.isDone());
                assert.deepEqual({
                    "57ee808cbacaa61500f92389": "Webhook to Code",
                    "5825c4c1b8a859001871bedd": "New Mailchimp subscriber",
                    "586638ee942fa9001dd25eea": "Webhook to Node.js Code"
                }, result);
            });
        });
    });

    describe('and API responded NOK', function () {
        let scope;
        before(() => scope = nock('http://foo.com').get('/v2/flows/').basicAuth({
            user: 'test-user',
            pass: 'test-key'
        }).reply(500, "boom!"));
        it('should return list of tasks', function (done) {
            action({}).then(() => done('Promise should fail')).catch(() => {
                assert.isOk(scope.isDone());
                done();
            });
        });
    });

    after(function () {
        delete process.env.ELASTICIO_API_URI;
        delete process.env.ELASTICIO_API_USERNAME;
        delete process.env.ELASTICIO_API_KEY;
    })
});
