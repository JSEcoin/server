/**
 * @file controller.js
 * @name JSE Controller (controller.js)
 * @example forever start -c "node --max-old-space-size=3000" controller.js &
 * @version 1.7.2
 * @description The controller carries out maintenance tasks for the JSE platform and blockchain.
 */

const JSE = {};
global.JSE = JSE;

// For testnet, set to 'local' or 'remote' (@string) to run on http://localhost:81 or https://testnet.jsecoin.com, false for production
JSE.jseTestNet = false; //'remote';

if (JSE.jseTestNet !== false) console.log('WARNING: RUNNING IN TESTNET MODE - '+JSE.jseTestNet); // idiot check

JSE.jseVersion = 'JSEcoin Controller';

const fs = require('fs');
const request = require('request');
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const eccrypto = require('eccrypto');
const sr = require('secure-random');
const exec = require('child_process');
const authenticator = require('authenticator');

// JSE Variables
JSE.jseSettings = {}; // set the first time in jseBlockChain.createGenesisBlock();
JSE.blockID = 0;
JSE.currentBlockString = '';
JSE.dbServer = 'http://10.128.0.12:80'; // use local ip address to avoid network fees
if (JSE.jseTestNet === 'local') {
	JSE.dbServer = 'http://localhost:80';
}
JSE.host = 'jsecoin.com'; // only used for logging in controller.js
JSE.port = '443'; // only used for logging in controller.js
JSE.logDirectory = 'logs/';
JSE.dataDirectory = 'data/'; // public access for ledger.json and blockchain.json
JSE.vLedgerError = '';
JSE.publicStats = {};
JSE.publicStats.ts = new Date().getTime();

if (fs.existsSync('./credentials.json')) { // relative to server.js
	JSE.credentials = require('./credentials.json'); // relative to datastore.js, extra ..
	JSE.authenticatedNode = true;
} else {
	JSE.credentials = false; // node with no authentication
	JSE.authenticatedNode = false;
}

JSE.jseFunctions = require('./modules/functions.js'); // round robin bug means has to be JSE
const jseBlockChain = require('./modules/blockchain.js');
const jseBackup = require('./modules/backup.js');
JSE.jseDataIO = require('./modules/dataio.js'); // can't call initialiseApp twice from modules

setInterval(function() {
	JSE.jseDataIO.getVariable('jseSettings',function(result) { JSE.jseSettings = result; });
},  300000); // every 5 mins

if (process.argv[2] && process.argv[2] === 'genesis')  jseBlockChain.createGenesisBlock();

setTimeout(function() {
	// old JSE listeners
	JSE.jseDataIO.getVariable('jseSettings',function(result) { JSE.jseSettings = result; });
	JSE.jseDataIO.getVariable('blockID',function(result) { JSE.blockID = result; });
}, 5000); // wait for db authentication


setTimeout(function() {
	jseBlockChain.newBlock();
}, 10000); // give time for firebase to return initial queries

setInterval(function() {
	JSE.jseDataIO.updatePublicStats();
}, 600000); // every 10 mins


setInterval(function() {
	jseBlockChain.verifyLedger();
}, 3600000); // every 60 mins

if (JSE.jseTestNet === false) {
	jseBlockChain.verifyLedger();
}

jseBackup.runAtMidnight(); // reset stats
jseBackup.runAtMidday(); // do merchant subsriptions

// Production use to prevent and log any crashes
if (JSE.jseTestNet === false) {
	process.on('uncaughtException', function(err) {
	  console.log('UnCaught Exception 83: ' + err);
	  console.error(err.stack);
	  fs.appendFile(JSE.logDirectory+'critical.txt', err+' / '+err.stack, function(){ });
	});
}
console.log(JSE.jseVersion);
