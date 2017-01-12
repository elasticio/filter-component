'use strict';
const co = require('co');
const rp = require('request-promise');

// This function will be called by the platform to verify credentials
module.exports = function verifyCredentials(credentials, cb) {
  console.log('Credentials passed for verification %j', credentials);

  co(function*() {
    console.log('Fetching user information');

    const test = yield rp({
      uri: 'https://cdn.elastic.io/test.json',
      json: true
    });

    console.log('Fetched JSON value=%j', test);

    console.log('Verification completed');

    cb(null, {verified: true});
  }).catch(err => {
    console.log('Error occurred', err.stack || err);
    cb(err , {verified: false});
  });
};
