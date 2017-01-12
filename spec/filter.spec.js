/* eslint-env node, jasmine */
'use strict';
const action = require('../lib/actions/filter').process;

describe('Test action', () => {
    it('should convert json to XML', (done) => {
        function onEmit(type, value) {
            if (type && type === 'data') {
                expect(value).toBeDefined();
            } else if (type && type === 'end') {
                expect(value).toBeUndefined();
                done();
            }
        }
        const msg = {
            body: {}
        };
        const cfg = {};
        const snapshot = {};
        action.call({
            emit: onEmit
        }, msg, cfg, snapshot);
    });
});
