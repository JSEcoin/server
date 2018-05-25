/* global describe it done */
const JSE = global.JSE;
const assert = require('assert');
const request = require('request');
const jseFunctions = require("./../modules/functions.js"); // required for signing data

describe('Server Route Testing (5 minutes)', function() {
	it('Test Login With Session Variable', function(done) {
		const credentials = {};
		credentials.session = JSE.testCredentials.user1.session;
		request({
			uri: JSE.testServer+'/login/',
			method: 'POST',
			json: credentials,
		}, function (err, res, body) {
			const returnObject = body;
			if (returnObject.fail === 1) {
				console.log('Session variable outdated. Enter a new one in ./../testcredentials.json, then restart the test');
				process.exit();
			}
			assert(returnObject.uid > 1);
			JSE.testCredentials.user1.uid = returnObject.uid;
			assert(returnObject.session === credentials.session);
			done();
		});
	});

	it('Test Registration Fail Without Recaptcha', function(done) {
		const newUser = {};
		newUser.name = 'Dave Lister';
		newUser.email = 'dave@reddwarf.com';
		newUser.password = 'a7kdfj23of0uqoXwSfq';
		newUser.address = 'Somewhere with goldfish shoals';
		newUser.country = 'US';
		const localTime = new Date();
		newUser.localTS = localTime.getTime();
		newUser.timeOffset = localTime.getTimezoneOffset();
		newUser.regTime = 30000;
		newUser.language = 'en-US';
		request({
			uri: JSE.testServer+'/register/',
			method: 'POST',
			json: newUser,
		}, function (err, res, body) {
			const returnObject = body;
			assert(returnObject.fail === 1);
			assert(returnObject.notification.indexOf('Recaptcha Error') > -1);
			done();
		});
	});

	it('Test Change Password Fail With Regex Reset Code', function(done) {
		const passObject = {};
		passObject.password = 'a7kdfj23of0uqoXwSfq';
		passObject.passwordReset = /.*/;
		request({
			uri: JSE.testServer+'/password/change/',
			method: 'POST',
			json: passObject,
		}, function (err, res, body) {
			const returnObject = body;
			assert(returnObject.fail === 1);
			done();
		});
	});


	it('Test Transfer Request', function(done) {
		const credentials = {};
		credentials.session = JSE.testCredentials.user1.session;
		credentials.toUser = JSE.testCredentials.user2.email;
		credentials.toAmount = 0.00001;
		credentials.toReference = 'Mocha Test No Transfer';
		request({
			uri: JSE.testServer+'/push/requesttransfer/',
			method: 'POST',
			json: credentials,
		}, function (err, res, body) {
			const returnObject = body;
			assert(returnObject.command === 'transfer');
			assert(returnObject.user2 === Number(JSE.testCredentials.user2.uid));
			assert(returnObject.value === 0.00001);
			done();
		});
	});

	it('Test Export Request', function(done) {
		const credentials = {};
		credentials.session = JSE.testCredentials.user1.session;
		credentials.exportAmount = 0.00001;
		request({
			uri: JSE.testServer+'/push/requestexport/',
			method: 'POST',
			json: credentials,
		}, function (err, res, body) {
			const returnObject = body;
			assert(returnObject.command === 'export');
			assert(returnObject.value === 0.00001);
			done();
		});
	});

	it('Transfer Funds to '+JSE.testCredentials.user2.email, function(done) {
		setTimeout(function() {
			const credentials = {};
			credentials.session = JSE.testCredentials.user1.session;
			credentials.toUser = JSE.testCredentials.user2.email;
			credentials.toAmount = 0.00001;
			credentials.toReference = 'Mocha Test Server Transfer';
			// log in first to get private key
			request({
				uri: JSE.testServer+'/login/',
				method: 'POST',
				json: credentials,
			}, function (err, res, body) {
				const returnObject = body;
				credentials.privateKey = returnObject.privateKey;
				credentials.publicKey = returnObject.publicKey;
				request({
					uri: JSE.testServer+'/push/requesttransfer/',
					method: 'POST',
					json: credentials,
				}, function (err2, res2, body2) {
					const returnObject2 = body2;
					assert(returnObject2.command === 'transfer');
					assert(returnObject2.user2 === Number(JSE.testCredentials.user2.uid));
					assert(returnObject2.value === 0.00001);
					jseFunctions.signData(JSON.stringify(returnObject2), credentials,function(signed) {
						request({
							uri: JSE.testServer+'/push/data/',
							method: 'POST',
							json: signed,
						}, function (err3, res3, body3) {
							const returnObject3 = body3;
							if (typeof returnObject3.fail !== 'undefined') console.log('Fail Notification 134: '+returnObject3.notification);
							assert(returnObject3.success === 1);
							done();
						});
					});
				});
			});
		}, 30000);
	});

	it('Complete merchant sale to '+JSE.testCredentials.user2.email, function(done) {
		setTimeout(function() {
			const credentials = {};
			credentials.buyer = {};
			credentials.session = JSE.testCredentials.user1.session;
			credentials.buyer.uid = JSE.testCredentials.user1.uid;
			credentials.uid = JSE.testCredentials.user2.uid; // seller
			credentials.item = 'mocha test merchant sale item';
			credentials.singlePrice = 0.00001;
			credentials.sAuth = JSE.testCredentials.user2.merchantAuthKey;
			request({
				uri: JSE.testServer+'/checkout/',
				method: 'POST',
				json: credentials,
			}, function (err, res, body) {
				const returnObject = body;
				if (typeof returnObject.fail !== 'undefined') console.log('Fail Notification 159: '+returnObject.notification);
				assert(returnObject.success === 1);
				done();
			});
		}, 30000);
	});

	it('Export and Import a Token', function(done) {
		setTimeout(function() {
			const credentials = {};
			credentials.session = JSE.testCredentials.user1.session;
			credentials.exportAmount = 0.00001;
			// log in first to get private key
			request({
				uri: JSE.testServer+'/login/',
				method: 'POST',
				json: credentials,
			}, function (err, res, body) {
				const returnObject = body;
				credentials.privateKey = returnObject.privateKey;
				credentials.publicKey = returnObject.publicKey;
				request({
					uri: JSE.testServer+'/push/requestexport/',
					method: 'POST',
					json: credentials,
				}, function (err2, res2, body2) {
					const returnObject2 = body2;
					assert(returnObject2.command === 'export');
					assert(returnObject2.value === 0.00001);
					jseFunctions.signData(JSON.stringify(returnObject2), credentials,function(signed) {
						request({
							uri: JSE.testServer+'/push/data/',
							method: 'POST',
							json: signed,
						}, function (err3, res3, body3) {
							const returnObject3 = body3;
							assert(returnObject3.success === 1);
							setTimeout(function(newCoinCode) {
								const newCredentials = {};
								newCredentials.session = JSE.testCredentials.user1.session;
								newCredentials.coinCode = newCoinCode;
								request({
									uri: JSE.testServer+'/push/import/',
									method: 'POST',
									json: newCredentials,
								}, function (err4, res4, body4) {
									const returnObject4 = body4;
									assert(returnObject4.success === 1);
									done();
								});
							}, 30000, returnObject3.coinCode);
						});
					});
				});
			});
		}, 30000);
	});

	it('Send lots of bad data to push/data', function(done) {
		setTimeout(function() {
			const credentials = {};
			credentials.session = JSE.testCredentials.user1.session;
			credentials.toUser = JSE.testCredentials.user2.email;
			credentials.toAmount = 0.00001;
			credentials.toReference = 'Mocha Test Server Transfer';
			// log in first to get private key
			request({
				uri: JSE.testServer+'/login/',
				method: 'POST',
				json: credentials,
			}, function (err, res, body) {
				const returnObject = body;
				credentials.privateKey = returnObject.privateKey;
				credentials.publicKey = returnObject.publicKey;
				request({
					uri: JSE.testServer+'/push/requesttransfer/',
					method: 'POST',
					json: credentials,
				}, function (err2, res2, body2) {
					const returnObject2 = body2;
					assert(returnObject2.command === 'transfer');
					assert(returnObject2.user2 === Number(JSE.testCredentials.user2.uid));
					assert(returnObject2.value === 0.00001);
					jseFunctions.signData(JSON.stringify(returnObject2), credentials,function(signed) {
						const goodSignedData = signed;
						let badSignedData = JSON.parse(JSON.stringify(goodSignedData));
						badSignedData.signature = 'abc123';
						request({
							uri: JSE.testServer+'/push/data/',
							method: 'POST',
							json: badSignedData,
						}, function (err3, res3, body3) {
							assert(body3.fail === 1);
							assert(body3.notification.indexOf('Could Not Verify Data Signature') > -1);
						});
						badSignedData = JSON.parse(JSON.stringify(goodSignedData));
						badSignedData.publicKey = JSE.testCredentials.user2.publicKey; // use someone elses publicKey
						request({
							uri: JSE.testServer+'/push/data/',
							method: 'POST',
							json: badSignedData,
						}, function (err4, res4, body4) {
							assert(body4.fail === 1);
							assert(body4.notification.indexOf('Could Not Verify Data Signature') > -1);
						});
						badSignedData = JSON.parse(JSON.stringify(goodSignedData));
						const parsedData = JSON.parse(badSignedData.data);
						parsedData.value = 9999999999999; // check amount can't be faked
						badSignedData.data = JSON.stringify(parsedData);
						request({
							uri: JSE.testServer+'/push/data/',
							method: 'POST',
							json: badSignedData,
						}, function (err5, res5, body5) {
							assert(body5.fail === 1);
							assert(body5.notification.indexOf('Could Not Verify Data Signature') > -1);
						});
					});
					setTimeout(function() {
						// try and fake amount before signature
						const returnObject3 = JSON.parse(JSON.stringify(returnObject2));
						returnObject3.value = 9999999999999;
						jseFunctions.signData(JSON.stringify(returnObject3), credentials,function(signed) {
							request({
								uri: JSE.testServer+'/push/data/',
								method: 'POST',
								json: signed,
							}, function (err6, res6, body6) {
								assert(body6.fail === 1);
								assert(body6.notification.indexOf('Insufficient Funds') > -1);
							});
						});
					}, 30000);
					setTimeout(function() {
						// try and fake user1 before signature - transfer
						const returnObject4 = JSON.parse(JSON.stringify(returnObject2));
						returnObject4.user1email = 'distribution@jsecoin.com';
						returnObject4.user1 = 0;
						jseFunctions.signData(JSON.stringify(returnObject4), credentials,function(signed) {
							request({
								uri: JSE.testServer+'/push/data/',
								method: 'POST',
								json: signed,
							}, function (err7, res7, body7) {
								assert(body7.fail === 1);
								assert(body7.notification.indexOf('Data object user1 does not match public key') > -1);
								done();
							});
						});
					}, 60000);
					setTimeout(function() {
						// try and fake user1 before signature - export
						const returnObject5 = JSON.parse(JSON.stringify(returnObject2));
						returnObject5.user1email = 'distribution@jsecoin.com';
						returnObject5.user1 = 0;
						returnObject5.command = 'export';
						jseFunctions.signData(JSON.stringify(returnObject5), credentials,function(signed) {
							request({
								uri: JSE.testServer+'/push/data/',
								method: 'POST',
								json: signed,
							}, function (err8, res8, body8) {
								assert(body8.fail === 1);
								assert(body8.notification.indexOf('Data object user1 does not match public key') > -1);
								done();
							});
						});
					}, 90000);
				});
			});
		}, 30000);
	});
});
