/* global describe it done */
const JSE = global.JSE;
const assert = require('assert');
const request = require('request');

describe('API Testing (90 seconds)', function() {
	it('Header Authorization Key and read access', function(done) {
		request({
			headers: { Authorization: JSE.testCredentials.user1.apiKey },
			uri: JSE.testServer+'/api/balance/secure/0/',
		}, function (err, res, body) {
			const returnObject = JSON.parse(body);
			assert(returnObject.success === 1);
			done();
		});
	});

	it('Standard balance query using the test credentials expects test user balance > 0.1', function(done) {
		request({
			uri: JSE.testServer+'/api/balance/'+JSE.testCredentials.user1.apiKey+'/0/',
		}, function (err, res, body) {
			const returnObject = JSON.parse(body);
			assert(returnObject.success === 1);
			assert(returnObject.balance > 0.1);
			done();
		});
	});

	it('Incorrect API Key Fails - Header Authorization', function(done) {
		request({
			headers: { Authorization: 'kasdjfklasjdfklajfk' },
			uri: JSE.testServer+'/api/balance/secure/0/',
		}, function (err, res, body) {
			const returnObject = JSON.parse(body);
			assert(returnObject.fail === 1);
			done();
		});
	});

	it('Incorrect API Key Fails - URL Authorization', function(done) {
		request({
			uri: JSE.testServer+'/api/balance/asdfasdfasdfkjaslkdfj/0/',
		}, function (err, res, body) {
			const returnObject = JSON.parse(body);
			assert(returnObject.fail === 1);
			done();
		});
	});

	it('Complete API transfer (write access) to '+JSE.testCredentials.user2.email, function(done) {
		request({
			uri: JSE.testServer+'/api/transfer/'+JSE.testCredentials.user1.apiKey+'/'+JSE.testCredentials.user2.email+'/0.00001/MochaTestingAPI/',
		}, function (err, res, body) {
			const returnObject = JSON.parse(body);
			assert(returnObject.success === 1);
			done();
		});
	});

	it('Import and Export API Call, Takes 90 seconds to clear locks', function(done) {
		setTimeout(function() {
			request({
				uri: JSE.testServer+'/api/export/'+JSE.testCredentials.user1.apiKey+'/0.00001/',
			}, function (err, res, body) {
				const returnObject = JSON.parse(body);
				assert(returnObject.success === 1);
				assert(returnObject.coinCode.length > 63);
				//console.log('Exported: '+returnObject.coinCode);
				setTimeout(function(newCoinCode) {
					request({
						uri: JSE.testServer+'/api/import/'+JSE.testCredentials.user1.apiKey+'/'+newCoinCode+'/',
					}, function (err2, res2, body2) {
						const returnObject2 = JSON.parse(body2);
						assert(returnObject2.success === 1);
						// try to import it again straight away
						request({
							uri: JSE.testServer+'/api/import/'+JSE.testCredentials.user1.apiKey+'/'+newCoinCode+'/',
						}, function (err3, res3, body3) {
							const returnObject3 = JSON.parse(body3);
							assert(returnObject3.fail === 1);
							done();
						});
					});
				}, 30000, returnObject.coinCode);
			});
		}, 30000);
	});

	it('History API Query (requires at least 3 transactions)', function(done) {
		request({
			uri: JSE.testServer+'/api/history/'+JSE.testCredentials.user1.apiKey+'/',
		}, function (err, res, body) {
			const returnObject = JSON.parse(body);
			assert(returnObject.success === 1);
			assert(Object.keys(returnObject.history).length > 2);
			done();
		});
	});

	it('Mining API Query (requires at least 3 transactions)', function(done) {
		request({
			uri: JSE.testServer+'/api/mining/'+JSE.testCredentials.user1.apiKey+'/',
		}, function (err, res, body) {
			const returnObject = JSON.parse(body);
			assert(returnObject.success === 1);
			assert(Object.keys(returnObject.mining).length > 2);
			done();
		});
	});

	it('Current Block ID and Get Block API Query', function(done) {
		request({
			uri: JSE.testServer+'/api/currentblockid/'+JSE.testCredentials.user1.apiKey+'/',
		}, function (err, res, body) {
			const returnObject = JSON.parse(body);
			assert(returnObject.success === 1);
			assert(returnObject.blockID > 1);
			request({
				uri: JSE.testServer+'/api/getblock/'+(returnObject.blockID-1)+'/'+JSE.testCredentials.user1.apiKey+'/',
			}, function (err2, res2, body2) {
				const returnObject2 = JSON.parse(body2);
				assert(returnObject2.success === 1);
				assert(returnObject2.block.blockID === (returnObject.blockID-1));
				done();
			});
		});
	});

	it('Download Ledger API Query', function(done) {
		request({
			uri: JSE.testServer+'/api/ledger/'+JSE.testCredentials.user1.apiKey+'/',
		}, function (err, res, body) {
			const returnObject = JSON.parse(body);
			assert(returnObject.success === 1);
			done();
		});
	});

	it('Check User ID API Query', function(done) {
		request({
			uri: JSE.testServer+'/api/checkuserid/'+JSE.testCredentials.user2.uid+'/'+JSE.testCredentials.user1.apiKey+'/',
		}, function (err, res, body) {
			const returnObject = JSON.parse(body);
			assert(returnObject.success === 1);
			assert(returnObject.publicKey === JSE.testCredentials.user2.publicKey);
			assert(returnObject.balance > 0.1);
			done();
		});
	});

	it('Check Public Key API Query', function(done) {
		request({
			uri: JSE.testServer+'/api/checkpublickey/'+JSE.testCredentials.user2.publicKey+'/'+JSE.testCredentials.user1.apiKey+'/',
		}, function (err, res, body) {
			const returnObject = JSON.parse(body);
			assert(returnObject.success === 1);
			assert(returnObject.uid === Number(JSE.testCredentials.user2.uid));
			assert(returnObject.balance > 0.1);
			done();
		});
	});
});
