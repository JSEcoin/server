/* global describe it done */
const JSE = global.JSE;
const assert = require('assert');

const randomString = JSE.jseFunctions.randString(8);

describe('jseDB Datastore Unit Test', function() {
	it('jseDB.setVariable', function(done) {
		JSE.jseDataIO.setVariable('jseSettings/test','Mocha Test 1 '+randomString);
		done();
	});

	it('jseDB.getVariable', function(done) {
		JSE.jseDataIO.getVariable('jseSettings/test',function(testString){
			assert(testString === 'Mocha Test 1 '+randomString);
			done();
		});
	});

	it('jseDB.setVariableThen', function(done) {
		JSE.jseDataIO.setVariableThen('jseSettings/test','Mocha Test 2 '+randomString,function(){
			JSE.jseDataIO.getVariable('jseSettings/test',function(testString){
				assert(testString === 'Mocha Test 2 '+randomString);
				done();
			});
		});
	});

	it('jseDB.pushVariable', function(done) {
		JSE.jseDataIO.pushVariable('jseSettings/test','Mocha Test 3 '+randomString,function(pushRef){
			assert(typeof pushRef === 'string');
			done();
		});
	});

	it('jseDB.deleteVariable', function() {
		JSE.jseDataIO.deleteVariable('jseSettings/test');
	});

	it('jseDB.plusX', function(done) {
		JSE.jseDataIO.setVariableThen('jseSettings/test',3,function() {
			JSE.jseDataIO.plusX('jseSettings/test',4);
			JSE.jseDataIO.getVariable('jseSettings/test',function(result) {
				assert(result === 7);
				done();
			});
		});
	});

	it('jseDB.genSafeKey', function() {
		const safeKey = JSE.jseDataIO.genSafeKey('jsecoinasdhfh32jk4to"£$%^&*()__-,.><jaksldfjkalsdjfkalsdjflkwjhflkjashvjkhasjkfdhjkhjkashdfjkh$%^YH65tg78g87g97gcva7sgdv97asgdvjsecoin');
		assert(safeKey.length === 100);
		assert(safeKey === 'jsecoinasdhfh32jk4tojaksldfjkalsdjfkalsdjflkwjhflkjashvjkhasjkfdhjkhjkashdfjkhYH65tg78g87g97gcva7sgd');
	});

	it('jseDB.checkExists', function(done) {
		JSE.jseDataIO.checkExists('jseSettings/test', function(trueFalse){
			assert(trueFalse === true);
			done();
		});
	});

	it('jseDB.countValues', function(done) {
		JSE.jseDataIO.countValues('registeredIPs','127.0.0.1', function(ipCount) {
			assert(typeof ipCount === 'number');
			done();
		});
	});

	it('jseDB.plusOne', function(done) {
		JSE.jseDataIO.plusOne('jseSettings/test');
		JSE.jseDataIO.getVariable('jseSettings/test',function(result) {
			assert(result === 8);
			done();
		});
	});

	it('jseDB.minusX', function(done) {
		JSE.jseDataIO.minusX('jseSettings/test',3);
		JSE.jseDataIO.getVariable('jseSettings/test',function(result) {
			assert(result === 5);
			done();
		});
	});

	it('jseDB.buildLedger', function(done) {
		JSE.jseDataIO.buildLedger(function(ledger){
			assert(ledger[145] > 0.1);
			done();
		});
	});

	it('jseDB.getBlock', function(done) {
		JSE.jseDataIO.getBlock(1,function(blockObject){
			assert(blockObject.blockID === 1);
			done();
		});
	});

	it('jseDB.getBlockRef', function() {
		const blockRef = JSE.jseDataIO.getBlockRef(123456);
		assert(blockRef === 123);
	});

	it('jseDB.checkUniqueEmail unique', function(done) {
		JSE.jseDataIO.checkUniqueEmail({ email: "asdfjkalsdfasdf@klasdjfklajsdfa.com" },function(userObject){
			// check existing one now
			assert(userObject.email === "asdfjkalsdfasdf@klasdjfklajsdfa.com");
			done();
		}, function(userObjectDuplicate) {
			assert(1 === 2);
			done();
		});
	});

	it('jseDB.checkUniqueEmail duplicate', function(done) {
		JSE.jseDataIO.checkUniqueEmail(JSE.testCredentials.user2,function(userObject2){
			assert(1 === 2);
			done();
		}, function(failJSON) {
			const failObject = JSON.parse(failJSON);
			assert(failObject.fail === 1);
			done();
		});
	});

	it('jseDB.checkDuplicate', function(done) {
		const userObj = { regip: "33.33.33.33", jseUnique: "sdfj3o48iF7" };
		JSE.jseDataIO.checkDuplicate(userObj,function(checkedUserObject){
			assert(checkedUserObject.jseUnique === "sdfj3o48iF7");
			done();
		}, function(){
			assert(1 === 2);
			done();
		});
	});

	it('jseDB.getEmail', function(done) {
		JSE.jseDataIO.getEmail(JSE.testCredentials.user2.uid,function(email){
			assert(email === JSE.testCredentials.user2.email);
			done();
		});
	});

	it('jseDB.getCredentialsByPassword', function(done) {
		const passwordHashed = JSE.jseFunctions.sha256(JSE.testCredentials.user1.password);
		JSE.jseDataIO.getCredentialsByPassword(JSE.testCredentials.user1.email,passwordHashed,function(credentials){
			assert(credentials.email === JSE.testCredentials.user1.email);
			JSE.testCredentials.user1.uid = credentials.uid;
			JSE.testCredentials.user1.session = credentials.session;
			JSE.testCredentials.user1.publicKey = credentials.publicKey;
			JSE.testCredentials.user1.privateKey = credentials.privateKey;
			done();
		}, function(){
			assert(1 === 2);
			done();
		});
	});

	it('jseDB.getCredentialsBySession', function(done) {
		JSE.jseDataIO.getCredentialsBySession(JSE.testCredentials.user1.session,function(credentials){
			assert(credentials.email === JSE.testCredentials.user1.email);
			done();
		}, function(){
			assert(1 === 2);
			done();
		});
	});

	it('jseDB.getCredentialsByAPIKey', function(done) {
		JSE.jseDataIO.getCredentialsByAPIKey(JSE.testCredentials.user1.apiKey,function(credentials){
			assert(credentials.email === JSE.testCredentials.user1.email);
			done();
		}, function(){
			assert(1 === 2);
			done();
		});
	});

	it('jseDB.getCredentialsByUID', function(done) {
		JSE.jseDataIO.getCredentialsByUID(JSE.testCredentials.user2.uid,function(credentials){
			assert(credentials.email === JSE.testCredentials.user2.email);
			done();
		});
	});

	it('jseDB.getUserData', function(done) {
		JSE.jseDataIO.getUserData(JSE.testCredentials.user1,function(account){
			assert(account.balance > 0.1);
			assert(Object.keys(account.history).length > 1);
			done();
		});
	});

	it('jseDB.getUserByEmail', function(done) {
		JSE.jseDataIO.getUserByEmail(JSE.testCredentials.user1.email,function(user){
			assert(user.uid === JSE.testCredentials.user1.uid);
			done();
		}, function(){
			assert(1 === 2);
			done();
		});
	});

	it('jseDB.lookupEmail', function(done) {
		JSE.jseDataIO.lookupEmail(JSE.testCredentials.user1.email,function(uid){
			assert(uid === JSE.testCredentials.user1.uid);
			done();
		});
	});

	it('jseDB.lookupSession', function(done) {
		JSE.jseDataIO.lookupSession(JSE.testCredentials.user1.session,function(uid){
			assert(uid === JSE.testCredentials.user1.uid);
			done();
		});
	});

	it('jseDB.lookupPublicKey', function(done) {
		JSE.jseDataIO.lookupPublicKey(JSE.testCredentials.user1.publicKey,function(uid){
			assert(uid === JSE.testCredentials.user1.uid);
			done();
		});
	});

	it('jseDB.lookupAPIKey', function(done) {
		JSE.jseDataIO.lookupAPIKey(JSE.testCredentials.user1.apiKey,function(uid){
			assert(uid === JSE.testCredentials.user1.uid);
			done();
		});
	});

	it('jseDB.checkUserByPublicKey', function(done) {
		JSE.jseDataIO.checkUserByPublicKey(JSE.testCredentials.user1.publicKey,function(user){
			assert(user.uid === JSE.testCredentials.user1.uid);
			done();
		}, function() {
			assert(1 === 2);
			done();
		});
	});

	it('jseDB.getUserByPublicKey', function(done) {
		JSE.jseDataIO.getUserByPublicKey(JSE.testCredentials.user1.publicKey,function(user){
			assert(user.uid === JSE.testCredentials.user1.uid);
			done();
		}, function() {
			assert(1 === 2);
			done();
		});
	});

	it('jseDB.getUserByUID', function(done) {
		JSE.jseDataIO.getUserByUID(JSE.testCredentials.user2.uid,function(credentials){
			assert(credentials.email === JSE.testCredentials.user2.email);
			done();
		});
	});

	it('jseDB.checkCredentialsByAPIKey', function(done) {
		JSE.jseDataIO.checkCredentialsByAPIKey(JSE.testCredentials.user1.apiKey,function(credentials){
			assert(credentials.uid === JSE.testCredentials.user1.uid);
			done();
		}, function() {
			assert(1 === 2);
			done();
		});
	});

	it('jseDB.updatePublicStats', function() {
		JSE.jseDataIO.updatePublicStats();
	});

	it('jseDB.getMyExportedCoins', function(done) {
		JSE.jseDataIO.getMyExportedCoins(JSE.testCredentials.user1.uid,function(myExports){
			assert(myExports.length > 1); // array
			done();
		});
	});

	it('jseDB.getPubStats', function(done) {
		JSE.jseDataIO.getPubStats(JSE.testCredentials.user1.uid,function(stats){
			assert(typeof stats === 'object');
			assert(Object.keys(stats).length === 3);
			done();
		});
	});

	it('jseDB.miningMaintenance', function() {
		JSE.jseDataIO.miningMaintenance(JSE.testCredentials.user1.uid);
	});

	it('Find bad data in ledger', function(done) {
		JSE.jseDataIO.buildLedger(function(ledger){
			Object.keys(ledger).forEach(function(key) {
				if (typeof ledger[key] !== 'number') {
					console.log('Potentially corrupted user data at: ledger/'+key+' = '+ledger[key]);
				} else {
					assert(typeof ledger[key] === 'number');
				}
			});
			done();
		});
	});

	it('Find bad data in stats', function(done) {
		JSE.jseDataIO.getVariable('statsToday',function(statsToday) {
			Object.keys(statsToday).forEach(function(key) {
				if (typeof statsToday[key].h !== 'number') console.log('Potentially corrupted data at: statsToday/'+key+'/h');
				assert(typeof statsToday[key].h === 'number');
				if (typeof statsToday[key].u !== 'number') console.log('Potentially corrupted data at: statsToday/'+key+'/u');
				assert(typeof statsToday[key].u === 'number');
				if (typeof statsToday[key].c !== 'number') console.log('Potentially corrupted data at: statsToday/'+key+'/c');
				assert(typeof statsToday[key].c === 'number');
				if (typeof statsToday[key].a !== 'number') console.log('Potentially corrupted data at: statsToday/'+key+'/a');
				assert(typeof statsToday[key].a === 'number');
				if (typeof statsToday[key].o !== 'number') console.log('Potentially corrupted data at: statsToday/'+key+'/o');
				assert(typeof statsToday[key].o === 'number');
			});
			done();
		});
	});
});
