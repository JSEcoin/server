/* global describe it done run */
const JSE = {};
global.JSE = JSE;
/*
JSE.testServer = 'https://load.jsecoin.com';
JSE.dbServer = 'http://35.188.209.171';
*/
JSE.testServer = 'http://localhost:81';
JSE.dataStore1 = 'http://localhost:82';
JSE.blockStore1 = 'http://localhost:83';

console.log('Starting Test For: '+JSE.testServer);

// Generate test credentials if necessary
JSE.setup = require('./mocha-setup.js');

// Load up test credentials
JSE.testCredentials = require('./../.testcredentials.json');

// Import datastore credentials
JSE.credentials = require('./../credentials.json');

// Unit Tests - Modules
// Test modules/functions.js
const functionsTest = require('./mocha-functionstest.js');

// Load functions now they've been tested.
JSE.jseFunctions = require('./../modules/functions.js');

JSE.authenticatedNode = true;

// Load jseDB functions for testing
JSE.jseDataIO = require('./../modules/dataio.js');

const dbTest = require('./mocha-dbtest.js');
const datastoreTest = require('./mocha-datastoretest.js');

// Test modules/datastore.js
setTimeout(function() {
	JSE.jseDataIO.getVariable('jseSettings',function(result) { JSE.jseSettings = result; });
	JSE.jseDataIO.getVariable('blockID',function(result) { JSE.blockID = result; });
	JSE.jseDataIO.getVariable('publicStats',function(result) { JSE.publicStats = result; });
	JSE.jseDataIO.getVariable('dailyPublicStats',function(result) { JSE.dailyPublicStats = result; });
}, 1500);

setTimeout(function() {
	run();
}, 2000);

// API & Server Tests

if (JSE.setup.testAPI) {
	const apiTest = require('./mocha-apitest.js'); // 90 seconds
}
if (JSE.setup.testRoutes) {
	const routesTest = require('./mocha-routestest.js'); // 90 seconds
}

describe('Closing Socket Connections', function() {
	it('Closing jseDB Socket.IO connection', function() {
		JSE.jseDataIO.closeConnection();
	});
});
