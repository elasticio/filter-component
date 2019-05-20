/* eslint-env node, mocha */
'use strict';
const assert = require('chai').assert;
const action = require('../lib/actions/filter').init;
const nock = require('nock');

describe('Given the getFlows init', function () {

    describe('no reject was configured', function () {
        it('should do nothing', function () {
            assert.isUndefined(action({}));
        });
    });

    before(function () {
        process.env.ELASTICIO_API_URI = 'http://foo.com';
        process.env.ELASTICIO_API_USERNAME = 'test-user';
        process.env.ELASTICIO_API_KEY = 'test-key';
        process.env.ELASTICIO_USER_ID = '55b62973e3831b0800000001';
    });
    describe('and API responded OK', function () {
        let scope;
        before(() => scope = nock('http://foo.com').get('/v2/flows/57ee808cbacaa61500f92389').basicAuth({
            user: 'test-user',
            pass: 'test-key'
        }).reply(200, require('./data/flow.json')));
        it('should resolve successfully ', function () {
            return action({
                reject: '57ee808cbacaa61500f92389'
            }).then((result) => {
                assert.isOk(scope.isDone());
                assert.equal('55b62973e3831b0800000001.57ee808cbacaa61500f92389/ordinary.step_1.requeue', result);
            });
        });
    });

    describe('and API responded NOK', function () {
        let scope;
        before(() => scope = nock('http://foo.com').get('/v2/flows/57ee808cbacaa61500f92389').basicAuth({
            user: 'test-user',
            pass: 'test-key'
        }).reply(400, 'boom!'));
        it('should return list of tasks', function (done) {
            action({
                reject: '57ee808cbacaa61500f92389'
            }).then(() => done('Promise should fail')).catch(() => {
                assert.isOk(scope.isDone());
                done();
            });
        });
    });

    after(function () {
        delete process.env.ELASTICIO_API_URI;
        delete process.env.ELASTICIO_API_USERNAME;
        delete process.env.ELASTICIO_API_KEY;
    });
});
