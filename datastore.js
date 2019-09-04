/**
 * @file datastore.js
 * @name JSE Datastore (datastore.js)
 * @example forever start -c "node --max-old-space-size=11500" datastore.js &
 * @example forever start -c "node --max-old-space-size=10000" datastore.js -f blockChain &
 * @example node --max-old-space-size=3000 datastore.js -p 82 -t local
 * @version 1.9.2
 * @description The JSE datastore is a custom key value storage system design to efficiently handle Javascript objects via socket.io
 */

const JSE = {};
global.JSE = JSE;
const commandLine = require('commander');

const imagemin = require('imagemin');
const imageminJpegtran = require('imagemin-jpegtran');
const imageminPngquant = require('imagemin-pngquant');
const imageminGifsicle = require('imagemin-gifsicle');

commandLine
	.option('-p, --port [value]', 'Port',  80)
	.option('-c, --credentials [value]', 'Credentials file location','./credentials.json')
	.option('-t, --testnet [value]', 'Launch the testnet as remote, local or log', false)
	.option('-f, --filter [value]', 'Filter for primary key start i.e. -f adx', false)
	.option('-n, --negfilter [value]', 'Negative filters for primary key start i.e. -n adx,blockChain', false)
	.parse(process.argv);

JSE.jseTestNet = commandLine.testnet;
const keyFilter = commandLine.filter;
const negFilter = commandLine.negfilter;

if (JSE.jseTestNet !== false) console.log('WARNING: RUNNING IN TESTNET MODE - '+JSE.jseTestNet); // idiot check

JSE.jseVersion = 'JSEcoin Datastore Server v1.9.1';

const dataDir = './data/'; // start with ./ relative to this files location ane end in slash i.e. ./data/
const bkupDir = './logs/'; // as above

const fs = require('fs');

if (fs.existsSync(commandLine.credentials)) {
	JSE.credentials = require(commandLine.credentials);  // eslint-disable-line
	JSE.authenticatedNode = true;
} else {
	JSE.credentials = false; // node with no authentication
	JSE.authenticatedNode = false;
}

const jseFunctions = require('./modules/functions.js');

const express = require('express');
const { exec } = require('child_process');

const port = commandLine.port;

// Setup express and socket.io for coms
const app = express();
app.set('trust proxy', true);

const server = require('http').Server(app);

server.timeout = 0; //1800000

const io = require('socket.io')(server, {
	transports: ['websocket'],
	origins: '*:*',
	pingInterval: 25000,
	pingTimeout: 1800000,
	//maxHttpBufferSize: 10000000, // 1GB, change for production to avoid DoS
});

const clients = {}; // socket.io clients

const data = {}; // root object for all data

function printMem() {
	return Math.round(Number(process.memoryUsage().rss) / 1000000);
}

function getTarget(key) { // can return a string, array, object, float whatever is stored at the key
	// key is a firebase style key i.e. 'siteIDs/145/mywebsitecom/s'
	const keySplit = (key.slice(-1) === '/') ? key.slice(0, -1).split('/') : key.split('/');
	if (keySplit.length === 1) {
		if (typeof data[keySplit[0]] !== 'undefined') {
			return data[keySplit[0]];
		}
	} else if (keySplit.length === 2) {
		if (typeof data[keySplit[0]] !== 'undefined' && typeof data[keySplit[0]][keySplit[1]] !== 'undefined' && data[keySplit[0]] !== null) { // double check the parents exist to avoid errors, throw a null back if any keys are undefined
			return data[keySplit[0]][keySplit[1]];
		}
	} else if (keySplit.length === 3) {
		if (typeof data[keySplit[0]] !== 'undefined' && data[keySplit[0]] !== null && typeof data[keySplit[0]][keySplit[1]] !== 'undefined' && data[keySplit[0]][keySplit[1]] !== null && typeof data[keySplit[0]][keySplit[1]][keySplit[2]] !== 'undefined') {
			return data[keySplit[0]][keySplit[1]][keySplit[2]];
		}
	} else if (keySplit.length === 4) {
		if (typeof data[keySplit[0]] !== 'undefined' && data[keySplit[0]] !== null && typeof data[keySplit[0]][keySplit[1]] !== 'undefined' && data[keySplit[0]][keySplit[1]] !== null && typeof data[keySplit[0]][keySplit[1]][keySplit[2]] !== 'undefined' && data[keySplit[0]][keySplit[1]][keySplit[2]] !== null && typeof data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] !== 'undefined') {
			return data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]];
		}
	} else if (keySplit.length === 5) {
		if (typeof data[keySplit[0]] !== 'undefined' && data[keySplit[0]] !== null && typeof data[keySplit[0]][keySplit[1]] !== 'undefined' && data[keySplit[0]][keySplit[1]] !== null && typeof data[keySplit[0]][keySplit[1]][keySplit[2]] !== 'undefined' && data[keySplit[0]][keySplit[1]][keySplit[2]] !== null && typeof data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] !== 'undefined' && data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] !== null && typeof data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]] !== 'undefined') {
			return data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]];
		}
	} else if (keySplit.length === 6) { // keys have a maximuim of six levels
		if (typeof data[keySplit[0]] !== 'undefined' && data[keySplit[0]] !== null && typeof data[keySplit[0]][keySplit[1]] !== 'undefined' && data[keySplit[0]][keySplit[1]] !== null && typeof data[keySplit[0]][keySplit[1]][keySplit[2]] !== 'undefined' && data[keySplit[0]][keySplit[1]][keySplit[2]] !== null && typeof data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] !== 'undefined' && data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] !== null && typeof data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]] !== 'undefined' && data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]] !== null  && typeof data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]][keySplit[5]] !== 'undefined') {
			return data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]][keySplit[5]];
		}
	} else {
		console.log('ERROR db.js 64: Maximum field length reached'); // should never hit this.
	}
	return null;
}

function setTarget(key, value) {
	// sets a value at key, key is firebase style, value can be an object, float, string etc.
	const keySplit = (key.slice(-1) === '/') ? key.slice(0, -1).split('/') : key.split('/');
	if (keySplit.length === 1) {
		data[keySplit[0]] = value; // root level
	} else if (keySplit.length === 2) { // 'ledger/145' example at keySplit.length == 2
		if (typeof data[keySplit[0]] === 'undefined' || data[keySplit[0]] === null) { data[keySplit[0]] = {}; } else if (typeof data[keySplit[0]] !== 'object') { return false; }
		data[keySplit[0]][keySplit[1]] = value;
	} else if (keySplit.length === 3) {
		if (typeof data[keySplit[0]] === 'undefined' || data[keySplit[0]] === null) { data[keySplit[0]] = {}; } else if (typeof data[keySplit[0]] !== 'object') { return false; }
		if (typeof data[keySplit[0]][keySplit[1]] === 'undefined' || data[keySplit[0]][keySplit[1]] === null) { data[keySplit[0]][keySplit[1]] = {}; } else if (typeof data[keySplit[0]][keySplit[1]] !== 'object') { return false; }
		data[keySplit[0]][keySplit[1]][keySplit[2]] = value;
	} else if (keySplit.length === 4) {
		if (typeof data[keySplit[0]] === 'undefined' || data[keySplit[0]] === null) { data[keySplit[0]] = {}; } else if (typeof data[keySplit[0]] !== 'object') { return false; }
		if (typeof data[keySplit[0]][keySplit[1]] === 'undefined' || data[keySplit[0]][keySplit[1]] === null) { data[keySplit[0]][keySplit[1]] = {}; } else if (typeof data[keySplit[0]][keySplit[1]] !== 'object') { return false; }
		if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]] === 'undefined' || data[keySplit[0]][keySplit[1]][keySplit[2]] === null) { data[keySplit[0]][keySplit[1]][keySplit[2]] = {}; } else if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]] !== 'object') { return false; }
		data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] = value;
	} else if (keySplit.length === 5) {
		if (typeof data[keySplit[0]] === 'undefined' || data[keySplit[0]] === null) { data[keySplit[0]] = {}; } else if (typeof data[keySplit[0]] !== 'object') { return false; }
		if (typeof data[keySplit[0]][keySplit[1]] === 'undefined' || data[keySplit[0]][keySplit[1]] === null) { data[keySplit[0]][keySplit[1]] = {}; } else if (typeof data[keySplit[0]][keySplit[1]] !== 'object') { return false; }
		if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]] === 'undefined' || data[keySplit[0]][keySplit[1]][keySplit[2]] === null) { data[keySplit[0]][keySplit[1]][keySplit[2]] = {}; } else if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]] !== 'object') { return false; }
		if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] === 'undefined' || data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] === null) { data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] = {}; } else if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] !== 'object') { return false; }
		data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]] = value;
	} else if (keySplit.length === 6) {
		if (typeof data[keySplit[0]] === 'undefined' || data[keySplit[0]] === null) { data[keySplit[0]] = {}; } else if (typeof data[keySplit[0]] !== 'object') { return false; }
		if (typeof data[keySplit[0]][keySplit[1]] === 'undefined' || data[keySplit[0]][keySplit[1]] === null) { data[keySplit[0]][keySplit[1]] = {}; } else if (typeof data[keySplit[0]][keySplit[1]] !== 'object') { return false; }
		if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]] === 'undefined' || data[keySplit[0]][keySplit[1]][keySplit[2]] === null) { data[keySplit[0]][keySplit[1]][keySplit[2]] = {}; } else if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]] !== 'object') { return false; }
		if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] === 'undefined' || data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] === null) { data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] = {}; } else if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] !== 'object') { return false; }
		if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]] === 'undefined' || data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]] === null) { data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]] = {}; } else if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]] !== 'object') { return false; }
		data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]][keySplit[5]] = value;
	} else {
		if (JSE.jseTestNet) console.log('ERROR db.js 90: Maximum field length reached'); // should never hit this.
		return false;
	}
	return true;
}

function deleteTarget(key) {
	// hard deletes a value at key, key is firebase style, value can be an object, float, string etc.
	const keySplit = (key.slice(-1) === '/') ? key.slice(0, -1).split('/') : key.split('/');
	if (keySplit.length === 1) {
		delete data[keySplit[0]]; // root level
	} else if (keySplit.length === 2) { // 'ledger/145' example at keySplit.length == 2
		if (typeof data[keySplit[0]] === 'undefined' || data[keySplit[0]] === null) { data[keySplit[0]] = {}; } else if (typeof data[keySplit[0]] !== 'object') { return false; }
		delete data[keySplit[0]][keySplit[1]];
	} else if (keySplit.length === 3) {
		if (typeof data[keySplit[0]] === 'undefined' || data[keySplit[0]] === null) { data[keySplit[0]] = {}; } else if (typeof data[keySplit[0]] !== 'object') { return false; }
		if (typeof data[keySplit[0]][keySplit[1]] === 'undefined' || data[keySplit[0]][keySplit[1]] === null) { data[keySplit[0]][keySplit[1]] = {}; } else if (typeof data[keySplit[0]][keySplit[1]] !== 'object') { return false; }
		delete data[keySplit[0]][keySplit[1]][keySplit[2]];
	} else if (keySplit.length === 4) {
		if (typeof data[keySplit[0]] === 'undefined' || data[keySplit[0]] === null) { data[keySplit[0]] = {}; } else if (typeof data[keySplit[0]] !== 'object') { return false; }
		if (typeof data[keySplit[0]][keySplit[1]] === 'undefined' || data[keySplit[0]][keySplit[1]] === null) { data[keySplit[0]][keySplit[1]] = {}; } else if (typeof data[keySplit[0]][keySplit[1]] !== 'object') { return false; }
		if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]] === 'undefined' || data[keySplit[0]][keySplit[1]][keySplit[2]] === null) { data[keySplit[0]][keySplit[1]][keySplit[2]] = {}; } else if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]] !== 'object') { return false; }
		delete data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]];
	} else if (keySplit.length === 5) {
		if (typeof data[keySplit[0]] === 'undefined' || data[keySplit[0]] === null) { data[keySplit[0]] = {}; } else if (typeof data[keySplit[0]] !== 'object') { return false; }
		if (typeof data[keySplit[0]][keySplit[1]] === 'undefined' || data[keySplit[0]][keySplit[1]] === null) { data[keySplit[0]][keySplit[1]] = {}; } else if (typeof data[keySplit[0]][keySplit[1]] !== 'object') { return false; }
		if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]] === 'undefined' || data[keySplit[0]][keySplit[1]][keySplit[2]] === null) { data[keySplit[0]][keySplit[1]][keySplit[2]] = {}; } else if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]] !== 'object') { return false; }
		if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] === 'undefined' || data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] === null) { data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] = {}; } else if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] !== 'object') { return false; }
		delete data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]];
	} else if (keySplit.length === 6) {
		if (typeof data[keySplit[0]] === 'undefined' || data[keySplit[0]] === null) { data[keySplit[0]] = {}; } else if (typeof data[keySplit[0]] !== 'object') { return false; }
		if (typeof data[keySplit[0]][keySplit[1]] === 'undefined' || data[keySplit[0]][keySplit[1]] === null) { data[keySplit[0]][keySplit[1]] = {}; } else if (typeof data[keySplit[0]][keySplit[1]] !== 'object') { return false; }
		if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]] === 'undefined' || data[keySplit[0]][keySplit[1]][keySplit[2]] === null) { data[keySplit[0]][keySplit[1]][keySplit[2]] = {}; } else if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]] !== 'object') { return false; }
		if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] === 'undefined' || data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] === null) { data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] = {}; } else if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] !== 'object') { return false; }
		if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]] === 'undefined' || data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]] === null) { data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]] = {}; } else if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]] !== 'object') { return false; }
		delete data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]][keySplit[5]];
	} else {
		if (JSE.jseTestNet) console.log('ERROR db.js 161: Maximum field length reached'); // should never hit this.
		return false;
	}
	return true;
}

function addTarget(key, value) {
	// add a float to the value at key, both the key and value must be able to parseFloat and if it's a blank then the 0 will be added.
	const keySplit = (key.slice(-1) === '/') ? key.slice(0, -1).split('/') : key.split('/');
	if (keySplit.length === 1) {
		data[keySplit[0]] = jseFunctions.round(parseFloat(data[keySplit[0]] || 0) + parseFloat(value));
	} else if (keySplit.length === 2) {
		if (typeof data[keySplit[0]] === 'undefined' || data[keySplit[0]] === null) { data[keySplit[0]] = {}; } else if (typeof data[keySplit[0]] !== 'object') { return false; }// create parent object if it doesn't exist, then put a zero in the target object
		data[keySplit[0]][keySplit[1]] = jseFunctions.round(parseFloat(data[keySplit[0]][keySplit[1]] || 0) + parseFloat(value));
	} else if (keySplit.length === 3) {
		if (typeof data[keySplit[0]] === 'undefined' || data[keySplit[0]] === null) { data[keySplit[0]] = {}; } else if (typeof data[keySplit[0]] !== 'object') { return false; }
		if (typeof data[keySplit[0]][keySplit[1]] === 'undefined' || data[keySplit[0]][keySplit[1]] === null) { data[keySplit[0]][keySplit[1]] = {}; } else if (typeof data[keySplit[0]][keySplit[1]] !== 'object') { return false; }
		data[keySplit[0]][keySplit[1]][keySplit[2]] = jseFunctions.round(parseFloat(data[keySplit[0]][keySplit[1]][keySplit[2]] || 0) + parseFloat(value));
	} else if (keySplit.length === 4) {
		if (typeof data[keySplit[0]] === 'undefined' || data[keySplit[0]] === null) { data[keySplit[0]] = {}; } else if (typeof data[keySplit[0]] !== 'object') { return false; }
		if (typeof data[keySplit[0]][keySplit[1]] === 'undefined' || data[keySplit[0]][keySplit[1]] === null) { data[keySplit[0]][keySplit[1]] = {}; } else if (typeof data[keySplit[0]][keySplit[1]] !== 'object') { return false; }
		if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]] === 'undefined' || data[keySplit[0]][keySplit[1]][keySplit[2]] === null) { data[keySplit[0]][keySplit[1]][keySplit[2]] = {}; } else if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]] !== 'object') { return false; }
		// Cannot read property 'PlatformMining' of null / TypeError: Cannot read property 'PlatformMining' of null
		data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] = jseFunctions.round(parseFloat(data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] || 0) + parseFloat(value));
	} else if (keySplit.length === 5) {
		if (typeof data[keySplit[0]] === 'undefined' || data[keySplit[0]] === null) { data[keySplit[0]] = {}; } else if (typeof data[keySplit[0]] !== 'object') { return false; }
		if (typeof data[keySplit[0]][keySplit[1]] === 'undefined' || data[keySplit[0]][keySplit[1]] === null) { data[keySplit[0]][keySplit[1]] = {}; } else if (typeof data[keySplit[0]][keySplit[1]] !== 'object') { return false; }
		if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]] === 'undefined' || data[keySplit[0]][keySplit[1]][keySplit[2]] === null) { data[keySplit[0]][keySplit[1]][keySplit[2]] = {}; } else if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]] !== 'object') { return false; }
		if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] === 'undefined' || data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] === null) { data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] = {}; } else if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] !== 'object') { return false; }
		data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]] = jseFunctions.round(parseFloat(data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]] || 0) + parseFloat(value));
	} else if (keySplit.length === 6) {
		if (typeof data[keySplit[0]] === 'undefined' || data[keySplit[0]] === null) { data[keySplit[0]] = {}; } else if (typeof data[keySplit[0]] !== 'object') { return false; }
		if (typeof data[keySplit[0]][keySplit[1]] === 'undefined' || data[keySplit[0]][keySplit[1]] === null) { data[keySplit[0]][keySplit[1]] = {}; } else if (typeof data[keySplit[0]][keySplit[1]] !== 'object') { return false; }
		if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]] === 'undefined' || data[keySplit[0]][keySplit[1]][keySplit[2]] === null) { data[keySplit[0]][keySplit[1]][keySplit[2]] = {}; } else if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]] !== 'object') { return false; }
		if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] === 'undefined' || data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] === null) { data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] = {}; } else if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] !== 'object') { return false; }
		if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]] === 'undefined' || data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]] === null) { data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]] = {}; } else if (typeof data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]] !== 'object') { return false; }
		data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]][keySplit[5]] = jseFunctions.round(parseFloat(data[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]][keySplit[5]] || 0) + parseFloat(value));
	} else {
		if (JSE.jseTestNet) console.log('ERROR db.js 116: Maximum field length reached'); // should never hit this.
		return false;
	}
	return true;
}

// These are the root keys used within the datastore for the JSEcoin project. Anything added which isn't included here wont be persistent or backed up.
//const rootKeys = ['merchantSales','merchantPurchases','locked','lookupExports','lookupEmail','lookupSession','lookupPublicKey','lookupAPIKey','account','blockChain','blockID','credentials','currentBlockString','currentHashes','dailyPublicStats','exported','history','investors','jseSettings','ledger','lottery','mining','nextUserID','passwordResetCodes','platformLottery','previousBlockPreHash','publicStats','registeredIPs','registeredUniques','serverLog','siteIDs','statsDaily','statsToday','statsTotal','subIDs','transactions'];

fs.readdir(dataDir, function(err, fileNames) {
	if (fileNames) {
		for (let i=0; i<fileNames.length; i+=1) {
			const fileName = fileNames[i];
			let skipFile = false;
			if (keyFilter) {
				if (fileName.substr(0,keyFilter.length) !== keyFilter) {
					console.log('Key Filter Skip: '+fileName);
					skipFile = true;
				}
			}
			if (negFilter) {
				const negFilterArr = negFilter.split(',');
				negFilterArr.forEach((neg) => {
					if (fileName.substr(0,neg.length) === neg) {
						console.log('Neg Filter Skip: '+fileName);
						skipFile = true;
					}
				});
			}
			if (!skipFile && fileName.indexOf('.json') > -1 && fileName.indexOf('_tmp.json') === -1) {
				if (fs.existsSync(dataDir+fileName)) {
					const rootKey = fileName.split('.json')[0];
					let jsonData = fs.readFileSync(dataDir+fileName, 'utf8');
					if (rootKey.indexOf('-') > -1) {
						if (rootKey.indexOf('blockChain') > -1) {
							const rkSplit = rootKey.split('-');
							const rootKeyMain = rkSplit[0];
							const rootKeySub = rkSplit[1];
							if (typeof data[rootKeyMain] === 'undefined') data[rootKeyMain] = {};
							console.log('Loading '+dataDir+fileName+' into '+rootKeyMain+'/'+rootKeySub+'/');
							data[rootKeyMain][rootKeySub] = JSON.parse(jsonData);
						} else { // history
							const rkSplit = rootKey.split('-');
							const rootKeyMain = rkSplit[0];
							const rootKeySub = rkSplit[1];
							if (typeof data[rootKeyMain] === 'undefined') data[rootKeyMain] = {};
							console.log('Loading '+dataDir+fileName+' into '+rootKeyMain+'/');
							Object.assign(data[rootKeyMain], JSON.parse(jsonData));
						}
					} else {
						console.log('Loading '+dataDir+fileName+' into '+rootKey+'/');
						data[rootKey] = JSON.parse(jsonData);
					}
					if (i === fileNames.length) console.log('Finished loading JSON data files');
					jsonData = null;
				}
			}
		}
	}
});

let queryCount = 0; // queryCount and timer are used for checking backup frequencies
let timer = 0;

function transferBackupFile() {
	const rightNow = new Date();
	const yymmddhhmm = rightNow.toISOString().slice(2,16).replace(/(-|T|:)/g,''); //YearMonthDayHourMinute 2vars each i.e. ./bkup/1802141200.json is midday on the 14th Feb 2018
	try {
		exec('tar -czf '+bkupDir+yymmddhhmm+'.tar.gz '+dataDir+'*.json', (err2, stdout2, stderr2) => { // store together as .tar.gz
			if (err2) { console.log('ERROR URGENT db.js 199: Error gzipping backup file'); }
			if (stderr2) console.log(`stderr: ${stderr2}`);

			// send file to controller for 2nd backup
			if (JSE.jseTestNet) console.log('Sending backup file to controller via scp');
			let outputFilename = 'datastore'+yymmddhhmm+'.tar.gz';
			if (keyFilter) {
				outputFilename = keyFilter+yymmddhhmm+'.tar.gz';
			}
			exec('scp -o StrictHostKeyChecking=no -i ./.p '+bkupDir+yymmddhhmm+'.tar.gz root@10.128.0.11:/root/logs/'+outputFilename, (err3, stdout3, stderr3) => { // store together as .tar.gz
				if (err3) { console.log('ERROR URGENT db.js 214: Error gzipping backup file'); }
				if (stderr3) console.log(`stderr: ${stderr3}`);
			});
		});
	} catch (ex) {
		console.log('Failed to transfer back up file, db.js 218 '+yymmddhhmm+' '+ex.message);
		fs.appendFile(bkupDir+'critical.txt', 'Failed to transfer back up file, db.js 218'+yymmddhhmm+' '+ex.message, function(){ });
	}
}


function nextSubKey(subKeysCurrent, subBkupFiles, rootKeysCurrent, bkupFiles, bkupStartTime) {
	const subKey = subKeysCurrent[subBkupFiles];
	const rootKey = rootKeysCurrent[bkupFiles];
	fs.writeFile(dataDir+rootKey+'-'+subKey+'_tmp.json', JSON.stringify(data[rootKey][subKey]), 'utf8', function(err) {
		if (err) { console.log('ERROR URGENT db.js 239: Error writing backup file '+err.stack); }
		fs.rename(dataDir+rootKey+'-'+subKey+'_tmp.json', dataDir+rootKey+'-'+subKey+'.json', function (err2) {
			if (err2) { console.log('ERROR URGENT db.js 241: Error moving backup file '+err2.stack); }
			const subBkupFilesPlusOne = subBkupFiles + 1;
			if (subBkupFilesPlusOne === subKeysCurrent.length) {
				const bkupFilesPlusOne = bkupFiles + 1;
				nextRootKey(rootKeysCurrent, bkupFilesPlusOne, bkupStartTime);
			} else {
				nextSubKey(subKeysCurrent, subBkupFilesPlusOne, rootKeysCurrent, bkupFiles, bkupStartTime);
			}
		});
	});
}

function nextRootKey(rootKeysCurrent, bkupFiles, bkupStartTime) {
	const rootKey = rootKeysCurrent[bkupFiles];
	try {
		if (rootKey === 'blockChain') { // blockChain exceeds size limit
			//bkupJSON[rootKey] = {};
			const subBkupFiles = 0;
			const subKeysCurrent = Object.keys(data[rootKey]);
			nextSubKey(subKeysCurrent, subBkupFiles, rootKeysCurrent, bkupFiles, bkupStartTime);
		} else if (rootKey === 'history') {
			const subBkupFiles = 0;
			const keyCount = Object.keys(data[rootKey]).length;
			const subKeyCount = Math.ceil(keyCount / 25000);
			for (let i = 0; i < subKeyCount; i+=1) {
				const tmpSubObject = {};
				const splitFileNo = i;
				for (let i2 = 0; i2 < 25000; i2+=1) {
					const userIndex = (splitFileNo * 25000) + i2;
					tmpSubObject[userIndex] = data[rootKey][userIndex];
				}
				fs.writeFile(dataDir+rootKey+'-'+splitFileNo+'_tmp.json', JSON.stringify(tmpSubObject), 'utf8', function(err) { // eslint-disable-line
					if (err) { console.log('ERROR URGENT db.js 306: Error writing backup file '+err.stack); }
					fs.rename(dataDir+rootKey+'-'+splitFileNo+'_tmp.json', dataDir+rootKey+'-'+splitFileNo+'.json', function (err2) {
						if (err2) { console.log('ERROR URGENT db.js 309: Error moving backup file '+err2.stack); }
					});
				});
			}
			const bkupFilesPlusOne = bkupFiles + 1;
			nextRootKey(rootKeysCurrent, bkupFilesPlusOne, bkupStartTime);
		} else if (typeof data[rootKey] === 'undefined') {
			const bkupFilesPlusOne = bkupFiles + 1;
			if (bkupFilesPlusOne >= rootKeysCurrent.length) { // run once after final file has completed backing up.
				const bkupFinishTime = new Date().getTime();
				console.log('Finished Writing BKUP File in: '+Math.round(((bkupFinishTime - bkupStartTime) / 1000),2)+' sec');
				transferBackupFile();
			} else {
				nextRootKey(rootKeysCurrent, bkupFilesPlusOne, bkupStartTime);
			}
		} else {
			fs.writeFile(dataDir+rootKey+'_tmp.json', JSON.stringify(data[rootKey]), 'utf8', function(err) { // eslint-disable-line
				if (err) { console.log('ERROR URGENT db.js 251: Error writing backup file '+err.stack); }
				fs.rename(dataDir+rootKey+'_tmp.json', dataDir+rootKey+'.json', function (err2) {
					if (err2) { console.log('ERROR URGENT db.js 256: Error moving backup file '+err2.stack); }
					const bkupFilesPlusOne = bkupFiles + 1;
					if (bkupFilesPlusOne === rootKeysCurrent.length) { // run once after final file has completed backing up.
						const bkupFinishTime = new Date().getTime();
						console.log('Finished Writing BKUP File in: '+Math.round(((bkupFinishTime - bkupStartTime) / 1000),2)+' sec');
						transferBackupFile();
					} else {
						nextRootKey(rootKeysCurrent, bkupFilesPlusOne, bkupStartTime);
					}
				});
			});
		}
	} catch (ex) {
		console.log('Failed to write to dataKey '+rootKey+', too large db.js 209 '+ex.message);
		fs.appendFile(bkupDir+'critical.txt', 'Failed to write to dataKey '+rootKey+', too large db.js 209 '+ex.message, function(){ });
		const emergencyBkupFilesPlusOne = bkupFiles + 1;
		nextRootKey(rootKeysCurrent, emergencyBkupFilesPlusOne, bkupStartTime);
	}
}

function runBackup() {
	if (JSE.jseTestNet) console.log('Starting Backup Process...');
	const bkupStartTime = new Date().getTime(); // backup time recorded just to check it's not taking to long once data grows
	//const bkupJSON = {};
	const rootKeysCurrent = Object.keys(data);
	const bkupFiles = 0;
	nextRootKey(rootKeysCurrent, bkupFiles, bkupStartTime);
}

function runPurge() {
	if (JSE.jseTestNet) console.log('Starting bkup file purge...');
	fs.readdir(bkupDir, function(err, fileNames) {
		const rightNow = new Date();
		const yymmddhhmm = rightNow.toISOString().slice(2,16).replace(/(-|T|:)/g,''); //YearMonthDayHourMinute 2vars each i.e. ./bkup/1802141200.json is midday on the 14th Feb 2018
		const threeHoursAgo = new Date();
		threeHoursAgo.setTime(threeHoursAgo.getTime() - 10800000); // 3hrs
		const threeHoursAgoYYMMDDHH = threeHoursAgo.toISOString().slice(2,13).replace(/(-|T|:)/g,'');
		const twoDays = new Date();
		twoDays.setTime(twoDays.getTime() - 172800000); // 48hrs
		const twoDaysYYMMDD = twoDays.toISOString().slice(2,11).replace(/(-|T|:)/g,'');
		// keep every file 8 hours, then then remove all but one per hour for 48 hours, then remove all but one per day for longer than that
		if (fileNames) {
			const toBin3hrs = [];
			const toBin48hrs = [];
			for (let i=0; i<fileNames.length; i+=1) {
				const fileName = fileNames[i];
				if (fileName.indexOf(threeHoursAgoYYMMDDHH) > -1) {
					toBin3hrs.push(fileName);
					if (JSE.jseTestNet) console.log('3hrs: '+fileName);
				}
				if (fileName.indexOf(twoDaysYYMMDD) > -1) {
					toBin48hrs.push(fileName);
					if (JSE.jseTestNet) console.log('48HRS: '+fileName);
				}
			}
			let savedFile3hrs;
			let savedFile48hrs;
			if (toBin3hrs.length > 0) savedFile3hrs = toBin3hrs.pop();
			if (toBin48hrs.length > 0) savedFile48hrs = toBin48hrs.pop();
			if (typeof savedFile48hrs !== 'undefined' && savedFile48hrs.indexOf('archive') === -1) {
				exec('mv '+bkupDir+savedFile48hrs+' '+bkupDir+'archive'+savedFile48hrs, (err4, stdout4, stderr4) => { // store together as .tar.gz
					if (err4) { console.log('ERROR URGENT db.js 264: Error moving backup file'); }
					if (stderr4) console.log(`stderr: ${stderr4}`);
				});
			}

			if (JSE.jseTestNet) console.log('Saved 3hrs: '+savedFile3hrs +' 48hrs: '+savedFile48hrs);
			for (let i = 0; i < toBin3hrs.length; i+=1) {
				const binFilename = toBin3hrs[i];
				if (JSE.jseTestNet) console.log('Deleting file: '+binFilename);
				fs.unlink(bkupDir+binFilename,function(err5){
					if (err5) console.log('DB.js ERROR DELETING FILE: '+binFilename+' - Error: '+err5);
			});
			}
			for (let i = 0; i < toBin48hrs.length; i+=1) {
				const binFilename = toBin48hrs[i];
				if (JSE.jseTestNet) console.log('Deleting file: '+binFilename);
				fs.unlink(bkupDir+binFilename,function(err6){
					if (err6) console.log('DB.js ERROR DELETING FILE: '+binFilename+' - Error: '+err6);
				});
			}
		}
	});
}

// Persistence and Backup Functionality
setInterval(function() {
	timer += 60;
	if (JSE.jseTestNet) console.log('Backup Check: queryCount: '+queryCount+', timer: '+timer);
	if (timer >= 900) {
	//if (queryCount >= 10000000 || timer >= 900) { // 15 mins or 10,000,000 queries, adapt this for production
		queryCount = 0; // reset - not used
		timer = 0; // reset
		runBackup();
		setTimeout(function() { runPurge(); }, 180000);// can complete before runBackup, OK just saving HD space but run 3mins later anyway.
	}
}, 60000);

function onConnection(socket){
	clients[socket.id] = socket;

	socket.on('disconnect', function() {
		if (JSE.jseTestNet) console.log('Got disconnected');
		clients[socket.id] = null;
		delete clients[socket.id];
	});

	clients[socket.id].realIP = socket.handshake.headers['x-real-ip'] || socket.handshake.headers['x-forwarded-for'] || socket.handshake.address || 'unknownIP'; // check if it's behind a load balancer, wont be in this case becasue we are using internal network
	if (clients[socket.id].realIP.indexOf(',') > -1) { clients[socket.id].realIP = socket.realIP.split(',')[0]; }
	if (clients[socket.id].realIP.indexOf(':') > -1) { clients[socket.id].realIP = socket.realIP.split(':').slice(-1)[0]; }	// clean up bad ip layouts.

	console.log('Connection made from '+socket.realIP);

	socket.on('authorize', function(credentialsKey) {
		if (JSE.jseTestNet) console.log('Authorizing...');
		if (credentialsKey === JSE.credentials.dbKey) {
			// could put IP authorization checks in here too if we want to beef up security
			if (typeof clients[socket.id] !== 'undefined') {
				clients[socket.id].authorized = 10; // could set read/write permissions
			}
			if (JSE.jseTestNet) console.log(socket.realIP+' Authorized Level: '+socket.authorized);
			socket.emit('authorized',socket.authorized);
		} else {
			socket.emit('authError');
		}
	});

	socket.on('setVariable', function(key, setObj) {
		if (socket.authorized > 8) {
			if (JSE.jseTestNet) console.log('setting: '+key);
			setTarget(key, setObj);
			//queryCount+=1;
		}
	});

	socket.on('getVariable', function(key,callback) {
		if (socket.authorized > 5) {
			if (JSE.jseTestNet) console.log('getting key: '+key);
			//queryCount+=1; // do we want queryCount to update on getVariabel queries? no data change on read
			let targetObj = getTarget(key);
			callback(targetObj);
			targetObj = null;
		}
	});

	socket.on('setVariableThen', function(key, setObj,callback) {
		if (socket.authorized > 8) {
			if (JSE.jseTestNet) console.log('settingthening: '+key);
			//queryCount+=1;
			setTarget(key, setObj);
			callback();
		}
	});

	socket.on('deleteVariable', function(key) {
		if (socket.authorized > 8) {
			if (JSE.jseTestNet) console.log('deleting Variable: '+key);
			//queryCount+=1;
			setTarget(key, {});
		}
	});

	socket.on('hardDeleteVariable', function(key) {
		if (socket.authorized > 8) {
			if (JSE.jseTestNet) console.log('deleting Variable: '+key);
			//queryCount+=1;
			deleteTarget(key);
		}
	});

	socket.on('plusX', function(key,x) {
		if (socket.authorized > 8) {
			if (JSE.jseTestNet) console.log('PlusXing: '+key+' : '+x);
			//queryCount+=1;
			addTarget(key, x);
		}
	});

	socket.on('storeFile', function(key,fileName,dataValue,encoding) {
		if (socket.authorized > 9) {
			if (JSE.jseTestNet) console.log('Storing File: '+key+' : '+fileName);
			const cleanFileName = fileName.split(/[^a-zA-Z0-9_.]/).join('').split('..').join('.');
			const extension = cleanFileName.substr(cleanFileName.length - 3).toLowerCase();
			// Only for adx datastore and images
			if (key.substring(0,3) === 'adx' && (extension === 'gif' || extension === 'png' || extension === 'jpg')) {
				fs.writeFile('static/raw/'+cleanFileName, dataValue, encoding, function(err) {
					if (err) console.log('Error writing image file ref. 35 '+err);
					(async () => {
						let outdir = 'static/';
						if (cleanFileName.indexOf('showcase/') > -1) outdir = 'static/showcase/';
						const compressedFiles = await imagemin(['static/raw/'+cleanFileName], outdir, {
							plugins: [
								imageminJpegtran(),
								imageminPngquant({ quality: [0.2, 0.5] }),
								imageminGifsicle(),
							],
							verbose: false,
						});
					})();
				});
			} else {
				console.log('Datastore error 527 storeFile bad key or file type: '+extension);
			}
		}
	});

	socket.on('backup', function() {
		if (socket.authorized > 8) {
			if (JSE.jseTestNet) console.log('running backup...');
			//queryCount+=1;
			runBackup();
		}
	});
}

io.on('connection', onConnection);

server.listen(port); // Start socket.io server, normally on port 80

console.log(JSE.jseVersion+' Datastore Server running on port: '+port);

if (JSE.jseTestNet === false) {
	process.on('uncaughtException', function(err) {
		console.log('UnCaught Exception 83: ' + err);
		console.error(err.stack);
		fs.appendFile(bkupDir+'critical.txt', err+' / '+err.stack, function(){ });
	});

	process.on('unhandledRejection', (reason, p) => {
		console.log('Unhandled Rejection at: '+p+' - reason: '+reason);
	});
}
