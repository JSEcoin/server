/* global describe it done */
const JSE = global.JSE;
const assert = require('assert');

JSE.jseFunctions = require('./../modules/functions.js');
const jseEthIntegration = require("./../modules/ethintegration.js");

describe('jseFunctions Unit Test', function() {
	it('jseFunctions.shuffle', function() {
		const array1 = [1,2,3,4,5,6,7,8,9,0];
		const array2 = [1,2,3,4,5,6,7,8,9,0]; // just for comparison
		JSE.jseFunctions.shuffle(array1);
		assert(array2.length === 10);
		assert(JSON.stringify(array1) !== JSON.stringify(array2));
	});

	it('jseFunctions.randString', function() {
		const randomString = JSE.jseFunctions.randString(64);
		assert(randomString.length === 64);
		assert(typeof randomString === 'string');
	});

	it('jseFunctions.round', function() {
		const result = JSE.jseFunctions.round(0.000000005);
		assert(result === Number(0.00000001)); // displays as 1e-8
		assert(typeof result === 'number');
		const result2 = JSE.jseFunctions.round(0.000000003);
		assert(result2 === 0);
		assert(typeof result2 === 'number');
		const result3 = JSE.jseFunctions.round(3.14159);
		assert(result3 === 3.14159);
		assert(typeof result3 === 'number');
	});

	it('jseFunctions.cleanString', function() {
		const clean = JSE.jseFunctions.cleanString('jsecoinc!"£$%^&*){}#<>?/.,:@~#Continuând,sunteți{}][❤☂☢本網站由Продолжая');
		assert(clean === 'jsecoinc$&*?/.,:@Continund,suntei');
		assert(typeof clean === 'string');
	});

	it('jseFunctions.limitString', function() {
		const clean = JSE.jseFunctions.limitString('abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ!"£$%^&*()abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ!"£$%^&*()abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ!"£$%^&*()abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ!"£$%^&*()');
		assert(clean === 'abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ!"£$%^&*()abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ!"£$%^&*()abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ!"£$%^&*()abcdefghijklmnopqrstuvwxyz1234567890ABC');
		assert(typeof clean === 'string');
	});

	it('jseFunctions.sha256', function() {
		const hash = JSE.jseFunctions.sha256('test');
		assert(hash === '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'); // could be caps
		assert(typeof hash === 'string');
	});

	it('jseFunctions.createKeyPair', function() {
		const keyPair = JSE.jseFunctions.createKeyPair();
		assert(keyPair.privateKey.length === 64);
		assert(keyPair.publicKey.length === 130);
		assert(typeof keyPair.privateKey === 'string');
		assert(typeof keyPair.publicKey === 'string');
	});

	it('jseFunctions.signData and jseFunctions.verifyData', function(done) {
		const keyPair = JSE.jseFunctions.createKeyPair();
		JSE.jseFunctions.signData('test',keyPair,function(signed) {
			JSE.jseFunctions.verifyData(signed,function() {
				done();
			}, function() {
				assert(1 ===2);
				done();
			});
		});
	});

	it('jseFunctions.signHash and jseFunctions.verifyHash', function(done) {
		const keyPair = JSE.jseFunctions.createKeyPair();
		const testHash = JSE.jseFunctions.sha256('test');
		JSE.jseFunctions.signHash(testHash,keyPair.privateKey,function(signature) {
			JSE.jseFunctions.verifyHash(testHash,keyPair.publicKey,signature,function() {
				done();
			}, function() {
				assert(1 ===2);
				done();
			});
		});
	});

	it('jseFunctions.genSafeUser', function() {
		const user = {};
		user.password = 'asdf';
		user.passwordHashed = 'fdsa';
		user.confirmCode = '123';
		user.authKey = 'asdf123';
		user.niceVariable = 'hello world';
		const safeUser = JSE.jseFunctions.genSafeUser(user);
		assert(typeof safeUser.password === 'undefined');
		assert(typeof safeUser.passwordHashed === 'undefined');
		assert(typeof safeUser.confirmCode === 'undefined');
		assert(typeof safeUser.authKey === 'undefined');
		assert(typeof safeUser.niceVariable === 'string');
	});

	it('jseFunctions.realityCheck', function(done) {
		JSE.jseFunctions.realityCheck('83.193.2.1', function(result) {
			assert(result === true);
			done();
		});
	});

	it('jseEthIntegration.newKeyPair', function() {
		const keyPair = jseEthIntegration.newKeyPair();
		assert(keyPair.address.substring(0,2) === '0x');
		assert(keyPair.privateKey.length === 66);
	});
});
