/**
 * @file controller.js
 * @name JSE Controller (controller.js)
 * @example forever start -c "node --max-old-space-size=3000" controller.js &
 * @example node controller.js -t local -d http://localhost:82 -e http://localhost:83 -a http://localhost:84
 * @version 1.9.2
 * @description The controller carries out maintenance tasks for the JSE platform and blockchain.
 */

const JSE = {};
global.JSE = JSE;

const commandLine = require('commander');

commandLine
	.option('-c, --credentials [value]', 'Credentials file location','./credentials.json')
	.option('-d, --datastore [value]', 'Authenticated datastore','http://10.128.0.5')
	.option('-e, --blockstore [value]', 'Authenticated blockstore','http://10.128.0.6')
	.option('-a, --adxstore [value]', 'Authenticated adxstore','http://10.128.0.10:81')
	.option('-t, --testnet [value]', 'Launch the testnet as remote, local or log', false)
	.option('-g, --genesis', 'Create a new genesis block', true)
	.parse(process.argv);

JSE.jseTestNet = commandLine.testnet;

if (JSE.jseTestNet !== false) console.log('WARNING: RUNNING IN TESTNET MODE - '+JSE.jseTestNet); // idiot check

JSE.jseVersion = 'JSEcoin Controller v1.8.2';

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
JSE.dataStore1 = commandLine.datastore;
JSE.blockStore1 = commandLine.blockstore;
JSE.adxStore1 = commandLine.adxstore;
JSE.host = 'jsecoin.com'; // only used for logging in controller.js
JSE.port = '443'; // only used for logging in controller.js
JSE.logDirectory = 'logs/';
JSE.dataDirectory = 'data/'; // public access for ledger.json and blockchain.json
JSE.vLedgerError = '';
JSE.publicStats = {};
JSE.publicStats.ts = new Date().getTime();

if (fs.existsSync(commandLine.credentials)) {
	JSE.credentials = require(commandLine.credentials); // eslint-disable-line
	JSE.authenticatedNode = true;
} else {
	JSE.credentials = false;
	JSE.authenticatedNode = false;
}

JSE.jseFunctions = require('./modules/functions.js'); // round robin bug means has to be JSE
const jseBlockChain = require('./modules/blockchain.js');
const jseSchedule = require('./modules/schedule.js');
const jseEthIntegration = require('./modules/ethintegration.js');
JSE.jseDataIO = require('./modules/dataio.js'); // can't call initialiseApp twice from modules

setInterval(function() {
	JSE.jseDataIO.getVariable('jseSettings',function(result) { JSE.jseSettings = result; });
	if (JSE.jseTestNet === false) jseSchedule.enterprisePayments();
	jseSchedule.pendingPayments();
},  300000); // every 5 mins

setTimeout(function() {
	// old JSE listeners
	JSE.jseDataIO.getVariable('jseSettings',function(result) { JSE.jseSettings = result; });
	JSE.jseDataIO.getVariable('blockID',function(result) { JSE.blockID = result; });
	if (commandLine.genesis) jseBlockChain.createGenesisBlock();
}, 5000); // wait for db authentication

setTimeout(function() {
	jseBlockChain.newBlock();
}, 10000); // give time for firebase to return initial queries

setInterval(function() {
	if (JSE.jseTestNet === false) jseEthIntegration.checkQueryPoolDeposits();
	if (JSE.jseTestNet === false) JSE.jseDataIO.updatePublicStats();
	if (JSE.jseTestNet === false) jseSchedule.pushPending();
}, 600000); // every 10 mins

setInterval(function() {
	jseBlockChain.verifyLedger();
}, 3600000); // every 60 mins

if (JSE.jseTestNet === false) {
	jseBlockChain.verifyLedger();
}

if (JSE.jseTestNet === false) jseSchedule.runAtMidnight(); // reset stats
if (JSE.jseTestNet === false) jseSchedule.runAtMidday(); // do merchant subsriptions
if (JSE.jseTestNet === false) jseSchedule.runAt5pm(); // best time to send emails

// Production use to prevent and log any crashes
if (JSE.jseTestNet === false) {
	process.on('uncaughtException', function(err) {
		console.log('UnCaught Exception 83: ' + err);
		console.error(err.stack);
		fs.appendFile(JSE.logDirectory+'critical.txt', err+' / '+err.stack, function(){ });
	});
}
console.log(JSE.jseVersion);
