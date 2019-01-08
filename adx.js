/**
 * @file adx.js
 * @name JSE Ad Exchange
 * @example forever start -c "node --max-old-space-size=3000" adx.js &
 * @example "node adx.js -t local -d http://localhost:82 -e http://localhost:83 -a http://localhost:84
 * @version 1.9.01
 * @description The ad exchange controls and maintains the ad exchange campaigns
 */

const JSE = {};
global.JSE = JSE;

const commandLine = require('commander');

commandLine
	.option('-c, --credentials [value]', 'Credentials file location','./credentials.json')
	.option('-d, --datastore [value]', 'Authenticated datastore','http://10.128.0.5')
	.option('-e, --blockstore [value]', 'Authenticated blockstore','http://10.128.0.6')
	.option('-a, --adxstore [value]', 'Authenticated adxstore','http://10.128.0.7')
	.option('-t, --testnet [value]', 'Launch the testnet as remote, local or log', false)
	.parse(process.argv);

JSE.jseTestNet = commandLine.testnet;

if (JSE.jseTestNet !== false) console.log('WARNING: RUNNING IN TESTNET MODE - '+JSE.jseTestNet); // idiot check

JSE.jseVersion = 'JSEcoin Ad Exchange v1.9.01';

const fs = require('fs');

JSE.jseSettings = {};
JSE.logDirectory = 'logs/';
JSE.dataDirectory = 'data/'; // public access for ledger.json and blockchain.json

if (fs.existsSync(commandLine.credentials)) {
	JSE.credentials = require(commandLine.credentials); // eslint-disable-line
	JSE.authenticatedNode = true;
} else {
	JSE.credentials = false;
	JSE.authenticatedNode = false;
}

JSE.jseFunctions = require('./modules/functions.js'); // round robin bug means has to be JSE
JSE.jseDataIO = require('./modules/dataio.js'); // can't call initialiseApp twice from modules

setInterval(function() {
	JSE.jseDataIO.getVariable('jseSettings',function(result) { JSE.jseSettings = result; });
},  300000); // every 5 mins

setTimeout(function() {
	JSE.jseDataIO.getVariable('jseSettings',function(result) { JSE.jseSettings = result; });
}, 5000); // wait for db authentication

// Production use to prevent and log any crashes
if (JSE.jseTestNet === false) {
	process.on('uncaughtException', function(err) {
		console.log('UnCaught Exception 83: ' + err);
		console.error(err.stack);
		fs.appendFile(JSE.logDirectory+'critical.txt', err+' / '+err.stack, function(){ });
	});
}
console.log(JSE.jseVersion);
