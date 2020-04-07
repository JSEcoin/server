/**
 * @file jsenode.js
 * @name JSE Node (jsenode.js)
 * @example forever start -c "node --max-old-space-size=3000" jsenode.js -s load.jsecoin.com -n load4 -m 0 &
 * @example node jsenode.js -t local -s localhost -p 81 -n jimv18 -d http://localhost:82 -e http://localhost:83 -a http://localhost:84 -m 0
 * @version 1.9.2
 * @description JSE nodes run the JSEcoin network. Each node can be used as a load server or as part of the p2p chain.<br><br>
		Command Line Options:<br>
		-f, --fullnode, Run fullnode rather than litenode<br>
		-n, --nickname [value], Server Nickname<br>
		-s, --server [value], Local Server Hostname,load.jsecoin.com<br>
		-i, --interface, Run JSE client interface rather than server<br>
		-c, --credentials [value], Credentials file location<br>
		-d, --datastore [value], Authenticated datastore<br>
		-e, --blockstore [value], Authenticated blockstore<br>
		-a, --adxstore [value], Authenticated adxstore<br>
		-b, --backup, Backup blockchain to logs/currentChain.json<br>
		-u, --unauth, Run as P2P node no authentication required<br>
		-m, --maxpeers [value], Set maximum outgoing peer connections<br>
		-l, --peerlist [value], Custom peer seed<br>
		-p, --port [value], Port,  80<br>
		-t, --testnet [value], Launch the testnet as remote, local or log
 */

const JSE = {};
global.JSE = JSE;
JSE.version = '1.9.2';

const fs = require('fs');
const request = require('request');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const crypto = require('crypto');
const eccrypto = require('eccrypto');
const sr = require('secure-random');
const exec = require('child_process');
const authenticator = require('authenticator');
const RateLimit = require('express-rate-limit');
const commandLine = require('commander');
const ascii = require('./modules/ascii.js');

console.log('\x1b[1m', ascii);
console.log('\x1b[0m','');
commandLine
	.version(JSE.version)
	.option('-f, --fullnode', 'Run fullnode rather than litenode')
	.option('-n, --nickname [value]', 'Server Nickname')
	.option('-s, --server [value]', 'Local Server Hostname','load.jsecoin.com')
	.option('-i, --interface', 'Run JSE client interface rather than server')
	.option('-c, --credentials [value]', 'Credentials file location','./credentials.json')
	.option('-d, --datastore [value]', 'Authenticated datastore','http://10.128.0.5')
	.option('-e, --blockstore [value]', 'Authenticated blockstore','http://10.128.0.6')
	.option('-a, --adxstore [value]', 'Authenticated adxstore','http://10.128.0.10:81')
	.option('-b, --backup', 'Backup blockchain to logs/currentChain.json')
	.option('-u, --unauth', 'Run as P2P node no authentication or datastore required')
	.option('-m, --maxpeers [value]', 'Set maximum outgoing peer connections', 3)
	.option('-l, --peerlist [value]', 'Custom peer seed','https://load.jsecoin.com:80') // production = https://server.jsecoin.com
	.option('-p, --port [value]', 'Port',  80)
	.option('-t, --testnet [value]', 'Launch the testnet as remote, local or log', false)
	.parse(process.argv);

JSE.jseTestNet = commandLine.testnet;

if (JSE.jseTestNet !== false) console.log('WARNING: RUNNING IN TESTNET MODE - '+JSE.jseTestNet); // idiot check

if (commandLine.nickname) {
	JSE.serverNickName = commandLine.nickname; // server1 will send stats to the self-miners
} else {
	const random = Math.floor((Math.random() * 9999) + 1);
	JSE.serverNickName = 'serverJSE' + random;
}

JSE.jseFullNode = commandLine.fullnode; // change to true if full historic sync with blockchain is required. NB. Full blockchain could take a LONG time to download.

console.log('Sever name set to: '+JSE.serverNickName);

JSE.host = commandLine.server; // set dynamically in app.listen
JSE.port = commandLine.port; // 80 behind load balancer on 443

JSE.dataStore1 = commandLine.datastore; // use local ip address to avoid network fees
JSE.blockStore1 = commandLine.blockstore;
JSE.adxStore1 = commandLine.adxstore;

const seedPeerSplit = commandLine.peerlist.split('/')[2].split(':'); // requires http and : port
JSE.peerList  =  {
 0:
		{
			server: seedPeerSplit[0], port: seedPeerSplit[1], sockID: 0, trust: 120,
		},
	};
JSE.maxPeers = parseInt(commandLine.maxpeers,10); // maximum number of peers to connect to for block data

if (fs.existsSync(commandLine.credentials)) { // relative to server.js
	JSE.credentials = require(commandLine.credentials); // eslint-disable-line
	JSE.authenticatedNode = true;
} else {
	JSE.credentials = false; // node with no authentication
	JSE.authenticatedNode = false;
}

JSE.jseVersion = 'JSEcoin Server v'+JSE.version+' - '+JSE.serverNickName;

if (commandLine.unauth) {
	JSE.credentials = false; // node with no authentication
	JSE.authenticatedNode = false;
}

if (JSE.authenticatedNode === true) console.log('Running as authenticated node via @ '+JSE.dataStore1+' & '+JSE.blockStore1+' & '+JSE.adxStore1);
if (JSE.authenticatedNode === false) console.log('Running in P2P Node Mode');

if (JSE.jseTestNet === 'local') {
	JSE.host = '127.0.0.1';
}
if (JSE.jseTestNet === 'remote') {
	JSE.host = 'testnet.jsecoin.com';
}

// JSE Global Variables
JSE.jseSettings = {};
JSE.blockID = 0;
JSE.publicStats = {};
JSE.dailyPublicStats = {};
JSE.serverLog = [];
JSE.lockedUIDs = []; // reset in modules/socketio.js
JSE.currentChain = {}; // currentBlockChain - last 1000 blocks, loaded from peers in modules/socket.io
JSE.logDirectory = 'logs/';
JSE.dataDirectory = 'data/'; // public access for ledger.json and blockchain.json
JSE.platformIPs = {}; // store these locally as non critical
JSE.platformUIDs = {};
JSE.platformUniqueIDs = {};
JSE.publisherIPs = {};
JSE.publisherIPsValidated = {};
JSE.pinAttempts = [];
JSE.creditQuickLookup = {}; // dont db query on each hit,hash,unique
JSE.recentSiteIDs = [];
JSE.recentSubIDs = [];
JSE.pubCache = {};
JSE.alreadySentReset = []; // restrict reset emails to one every 30 minutes
JSE.alreadySentWelcomes = []; // restrict resend welcome emails to 1 per 30 minutes
JSE.alreadySentGeneral = []; // restrict support emails to 1 per 30 minutes
JSE.apiLimits = {}; // restrict api queries
JSE.loginLimits = {};
JSE.preHash = '0';
JSE.minerAuthKey = '0';
JSE.vpnData = {};
JSE.adxActiveCampaigns = {};
JSE.adxActiveKeywords = {};
JSE.adxPool = {};
JSE.adxCategories = {};

setInterval(function() {
	JSE.alreadySentReset = [];
	JSE.alreadySentWelcomes = [];
	JSE.alreadySentGeneral = [];
	JSE.apiLimits = {};
}, 1800000); // 30mins

setInterval(function() {
	JSE.loginLimits = {};
}, 240000); // 4mins

JSE.jseFunctions = require('./modules/functions.js'); // round robin bug means has to be JSE
JSE.jseDataIO = require('./modules/dataio.js'); // can't call initialiseApp twice from modules

JSE.anonymousIPs = {};
if (JSE.jseTestNet === false) {
	setTimeout(function() {
		console.log('Loaded '+Object.keys(JSE.anonymousIPs).length+' anonymous IPs');
	}, 20000);
	request('https://iplists.firehol.org/files/firehol_anonymous.netset', function (error, response, body) {
		if (body) {
			const fireholRaw = body.split("\n");
			Object.keys(fireholRaw).forEach(function(key) {
				let fireholIP = fireholRaw[key];
				if (fireholIP && fireholIP.indexOf('/') > -1) {
					fireholIP = fireholIP.split('/')[0];
				}
				JSE.anonymousIPs[fireholIP] = true;
			});
		}
		if (error) console.log('Anonymous IP list download error. server.js 107: '+error);
		//console.log('Loaded '+Object.keys(JSE.anonymousIPs).length+' anonymous IP addresses from firehol.org');
	});
	request('https://check.torproject.org/exit-addresses', function (error, response, body) {
		if (body) {
			const torIPsRaw = body.split("\n");
			Object.keys(torIPsRaw).forEach(function(key) {
				let torIP = torIPsRaw[key];
				if (torIP.indexOf('ExitAddress ') > -1) {
					torIP = torIP.split('ExitAddress ')[1];
					if (torIP && torIP.indexOf(' ') > -1) {
						torIP = torIP.split(' ')[0];
					}
					JSE.anonymousIPs[torIP] = true;
				}
			});
		}
		if (error) console.log('Anonymous IP list download error. server.js 186: '+error);
		//console.log('Loaded '+Object.keys(JSE.anonymousIPs).length+' anonymous IP addresses from torproject.org');
	});
}


const routes = require('./routes/routes.js');

const app = express();

app.use(compression({ threshold: 0 }));
app.use(bodyParser.json({ limit: '2mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '2mb', extended: true }));
app.use(cookieParser());
app.set('trust proxy', true);

// Serve sttatic platform & blockchain files
app.use('/blockchain/', express.static('./../blockchain/dist/'));
app.use('/platform/', express.static('./../platform/'));

const limiter = new RateLimit({
	windowMs: 7*60*1000, // 15 mins
	max: 1000, // limit each IP to 500 requests per windowMs
	delayMs: 0, // disable delaying - full speed until the max limit is reached
});

app.use(limiter);

app.use(routes);

app.use(function(err, req, res, next) {
	if (JSE.jseTestNet !== false) console.log('Express Request Error: '+err.stack); //err.stack
});

/** Store capped serverLog in global variable to pull to admin panel */
console.log = function(d) {
	process.stdout.write(d+"\n");
	JSE.serverLog.push(d);
	if (JSE.serverLog.length >= 50) {
		const serverLogText = JSE.serverLog.join("\n");
		JSE.serverLog = [];
		JSE.jseDataIO.setVariable('serverLog',serverLogText);
	}
};

/**  Start peer to peer networking module */
function startP2P() {
	const p2p = require('./modules/p2p.js');
}

/**  Fire up the http and socket.io servers */
function startServers() {
	const server = require('http').Server(app);
	const io = require('socket.io')(server);
	//io.set('origins', '*:*');
	io.origins('*:*');
	server.listen(JSE.port);
	console.log(JSE.jseVersion+' API running on port: '+JSE.port);
	server.timeout = 300000; // 5min
	const jseSocketIO = require('./modules/socketio.js');
	jseSocketIO.startServer(server,io);
}

/**  Update non-critical global variables every 5 minutes */
if (JSE.authenticatedNode === true) {
	setTimeout(function() {
		JSE.jseDataIO.getVariable('jseSettings',function(result) { JSE.jseSettings = result; });
		JSE.jseDataIO.getVariable('blockID',function(result) { JSE.blockID = result; });
		JSE.jseDataIO.getVariable('publicStats',function(result) { JSE.publicStats = result; });
		JSE.jseDataIO.getVariable('dailyPublicStats',function(result) { JSE.dailyPublicStats = result; });
		JSE.jseDataIO.getVariable('adxActiveCampaigns',function(result) { JSE.adxActiveCampaigns = result; });
		JSE.jseDataIO.getVariable('adxActiveKeywords',function(result) { JSE.adxActiveKeywords = result; });
		JSE.jseDataIO.getVariable('adxCategories',function(result) { JSE.adxCategories = result; });
	}, 3000); // allow redis to authorize

	setInterval(function() {
		JSE.jseDataIO.getVariable('publicStats',function(result) { JSE.publicStats = result; });
		JSE.jseDataIO.getVariable('dailyPublicStats',function(result) { JSE.dailyPublicStats = result; });
		JSE.jseDataIO.getVariable('jseSettings',function(result) { JSE.jseSettings = result; });
		JSE.jseDataIO.pushVariable('adxPools/',JSE.adxPool,function(pushRef) { JSE.adxPool = {}; });
		JSE.jseDataIO.getVariable('adxActiveCampaigns',function(result) { JSE.adxActiveCampaigns = result; });
		JSE.jseDataIO.getVariable('adxActiveKeywords',function(result) { JSE.adxActiveKeywords = result; });
	}, 300000); // every 5 mins
}

if (commandLine.interface) {
	const cli = require('./tools/jse.js');
} else {
	setTimeout(function() { console.log('Starting servers...'); startServers(); startP2P(); }, 6000); // give everything a chance to load from firebase
}

/**  Stop mining abuse by limiting lottery entry to every 60 seconds */
function fairReset() {
	JSE.platformIPs = {};
	JSE.platformUIDs = {};
	JSE.platformUniqueIDs = {};
	setTimeout(function() {
		fairReset();
	}, JSE.jseSettings.fairResetTime || 10000);
}
fairReset();

/**  Limit pin attempts to 3 per 6 hours */
function fairResetLong() {
	JSE.pinAttempts = [];
	setTimeout(function() {
		fairResetLong();
		JSE.jseDataIO.getVariable('adxCategories',function(result) { JSE.adxCategories = result; });
		JSE.pubCache = {};
	}, 21600000); // 6 hours
}
fairResetLong();

/**  Limit publisher mining rewards to one per IP per 24 hours */
function fairResetDaily() {
	JSE.publisherIPs = {};
	setTimeout(function() {
		fairResetDaily();
	}, 86400000); // 24 hours
}
fairResetDaily();

function validatedReset() {
	JSE.publisherIPsValidated = {};
	setTimeout(function() {
		validatedReset();
	}, 180000); // 3 mins
}
validatedReset();

/**  Create a minerAuthKey every 60 mins from a private seed and the current date and time */
function genMinerAuthKey() {
	const now = new Date();
	const thisHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(),0,0,0);
	const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()+1,0,0,0);
	const nextTimeout = (nextHour - now)+1000;
	JSE.minerAuthKey = JSE.jseFunctions.sha256(JSE.credentials.minerAuthKeySeed+thisHour.toLocaleString());
	console.log('minerAuthKey updated: '+JSE.minerAuthKey+' next update: '+(nextTimeout / 60000).toFixed()+' mins');
	setTimeout(function() {
		genMinerAuthKey();
	}, nextTimeout);
}
genMinerAuthKey();

if (commandLine.backup) {
	setInterval(function() {
		fs.writeFile(JSE.logDirectory+'currentChain.json', JSON.stringify(JSE.currentChain), 'utf8', function(error) { // write over file using utf8 encoding, may need to change if we accept unicode etc.
			if (error) { if (JSE.jseTestNet) console.log('ERROR URGENT socketio.js 8: Error writing backup file'); }
		});
	}, 300000); // 5 mins
}

if (JSE.jseTestNet === false) {
	process.on('uncaughtException', function(err) {
		console.log('UnCaught Exception 83: ' + err);
		console.error(err.stack);
		fs.appendFile(JSE.logDirectory+'critical.txt', err+' / '+err.stack, function(){ });
	});

	process.on('unhandledRejection', (reason, p) => {
		console.log('Unhandled Rejection at: '+p+' - reason: '+reason);
	});
}
