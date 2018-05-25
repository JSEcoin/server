/* global describe it done */
const JSE = global.JSE;
const assert = require('assert');

describe('Datastore Break Test', function() {
	it('DB delete jseSettings/test to start fresh', function() {
		JSE.jseDataIO.deleteVariable('jseSettings/test');
	});

	it('DB set blank object', function(done) {
		JSE.jseDataIO.setVariableThen('jseSettings/test/blankObject',{},function() {
			JSE.jseDataIO.getVariable('jseSettings/test/blankObject',function(reply) {
				assert(JSON.stringify(reply) === "{}");
				done();
			});
		});
	});

	it('DB set a sub object', function(done) {
		JSE.jseDataIO.setVariableThen('jseSettings/test/blankObject/subObject',123,function() {
			JSE.jseDataIO.getVariable('jseSettings/test/blankObject/subObject',function(reply) {
				assert(reply === 123);
				done();
			});
		});
	});

	it('DB set a numeric key', function(done) {
		JSE.jseDataIO.setVariableThen('jseSettings/test/123',123,function() {
			JSE.jseDataIO.getVariable('jseSettings/test/123',function(reply) {
				assert(reply === 123);
				done();
			});
		});
	});

	it('DB set a "\\ key', function(done) {
		JSE.jseDataIO.setVariableThen('jseSettings/test/"\\',123,function() {
			JSE.jseDataIO.getVariable('jseSettings/test/"\\',function(reply) {
				assert(reply === 123);
				done();
			});
		});
	});

	it('DB set a blank sub key', function(done) {
		JSE.jseDataIO.setVariableThen('jseSettings/test//blankkey',123,function() {
			JSE.jseDataIO.getVariable('jseSettings/test//blankkey',function(reply) {
				assert(reply === 123);
				done();
			});
		});
	});

	it('PlusOne 5000 times and count the result', function(done) {
		JSE.jseDataIO.setVariableThen('jseSettings/test/plusXtest',0,function() {
			for (let i = 0; i < 5000; i+=1) {
				JSE.jseDataIO.plusOne('jseSettings/test/plusXtest');
			}
			JSE.jseDataIO.getVariable('jseSettings/test/plusXtest',function(reply) {
				assert(reply === 5000);
				done();
			});
		});
	});

	it('setVariable 5000 times and check the result', function(done) {
		for (let i = 0; i < 5000; i+=1) {
			JSE.jseDataIO.setVariable('jseSettings/test/setVariabletest',i);
		}
		JSE.jseDataIO.getVariable('jseSettings/test/setVariabletest',function(reply) {
			assert(reply === 4999);
			done();
		});
	});

	it('DB set a 10 deep subkey', function(done) {
		JSE.jseDataIO.setVariableThen('jseSettings/test/3/4/5/6/7/8/9/10',123,function() {
			JSE.jseDataIO.getVariable('jseSettings/test/3/4/5/6/7/8/9/10',function(reply) {
				assert(reply === null);
				done();
			});
		});
	});

	it('DB set a sting then try setting a sub obect of the string', function(done) {
		JSE.jseDataIO.setVariableThen('jseSettings/test/string','this isnt going to work',function() {
			JSE.jseDataIO.setVariableThen('jseSettings/test/string/subObject','this defo isnt going to work',function() {
				JSE.jseDataIO.getVariable('jseSettings/test/string/subobject',function(reply) {
					assert(reply === null);
					done();
				});
			});
		});
	});

	it('DB delete jseSettings/test variable', function(done) {
		JSE.jseDataIO.deleteVariable('jseSettings/test');
		JSE.jseDataIO.getVariable('jseSettings/test',function(reply) {
			assert(JSON.stringify(reply) === "{}");
			done();
		});
	});
});
