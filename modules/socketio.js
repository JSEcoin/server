/**
 * @module jseSocketIO
 * @description Socket.io Server used for coms with mining clients and peers<br>
 * Server has four core functions:
 * <ul>
 * <li>Receive mining connections</li>
 * <li>p2p server for incomming connections</li>
 * <li>Blockchain explorer functions</li>
 * <li>Finally send out new preHashes and Blocks (to miners and p2p block subscribers)</li>
 * </ul>
 * <h5>Exported</h5>
 * <ul><li>jseSocketIO</li></ul>
 */

const JSE = global.JSE;
const fs = require('fs'); // only required temporarily for testing
const request = require('request');

const jseLottery = require("./lottery.js");

JSE.socketConnections = {}; // incoming connections to the server, includes miners and peers

const jseSocketIO = {

/**
 * @method <h2>startServer</h2>
 * @description Start up the socket IO server, called from jsenode.js
 * @param {object} server http server object
 * @param {object} io socketio object
 */
	startServer(server,io) {
		function onConnection(socket){
			JSE.socketConnections[socket.id] = socket;
			socket.on('disconnect', function() {
				if (JSE.peerList[socket.id] !== 'undefined') {
					if (JSE.jseTestNet) console.log('Removing peer from peerlist: '+socket.id); // getting a lot of these on the load servers despite there not being any p2p connections???
					JSE.peerList[socket.id] = null; // free for garbage collection;
					delete JSE.peerList[socket.id];
				}
				if (JSE.socketConnections[socket.id] !== 'undefined') {
					JSE.socketConnections[socket.id] = null;
					delete JSE.socketConnections[socket.id];
				}
				//console.log(JSON.stringify(peerList));
			});
			JSE.socketConnections[socket.id].realIP = socket.handshake.headers["x-real-ip"] || socket.handshake.headers["x-forwarded-for"] || socket.handshake.address || 'unknownIP';
			if (JSE.socketConnections[socket.id].realIP.indexOf(',') > -1) { JSE.socketConnections[socket.id].realIP = JSE.socketConnections[socket.id].realIP.split(',')[0]; }
			if (JSE.socketConnections[socket.id].realIP.indexOf(':') > -1) { JSE.socketConnections[socket.id].realIP = JSE.socketConnections[socket.id].realIP.split(':').slice(-1)[0]; }
			if (JSE.jseTestNet) console.log('SOCKET CONNECTION made from '+socket.realIP);

			/** P2P Connections */

			// Respond to peer list with our current version of the peerList
			socket.on('peerList', function(theirPeerList, theirVersion, theirHost, theirPort, callback) {
				console.log('peerList Request From '+theirVersion+' on '+socket.realIP+' : '+theirPort);
				callback(JSE.peerList,JSE.blockID,JSE.jseSettings);
			});

			// Respond to helloWorld, equivalent of version
			socket.on('helloWorld', function(theirVersion, theirHost, theirPort, callback) {
				if (typeof JSE.socketConnections[socket.id] !== 'undefined') {
					JSE.socketConnections[socket.id].miningType = 0; // not a miner
					JSE.socketConnections[socket.id].realPort = theirPort || 80; // set port number delivered from the client in server.js
				}
				const peerListEntry = {
					server: socket.realIP, port: theirPort, sockID: socket.id, trust: 0,
				};

				let alreadyAdded = false;
				if (JSE.peerList[socket.id]) {
					Object.keys(JSE.peerList[socket.id]).forEach(function(key) {
						if (JSE.peerList[socket.id][key].host === theirHost && JSE.peerList[socket.id][key].port === theirPort) {
							alreadyAdded = true;
						}
					});
				}
				if (alreadyAdded === false) {
					JSE.peerList[socket.id] = peerListEntry;
				}
				console.log('helloWorld Connection From '+theirVersion+' on '+socket.realIP+' : '+socket.realPort+' added to peerList');
				if (typeof JSE.socketConnections[socket.id] !== 'undefined') {
					JSE.socketConnections[socket.id].clientVersion = theirVersion;
				}
				callback(JSE.jseVersion);
			});

			// Respond to chainUpdate request for the latest blockChain
			socket.on('chainUpdate', function(theirBlockRefRaw, theirBlockIDRaw, callback) {
				let theirBlockID = theirBlockIDRaw;
				let theirBlockRef = theirBlockRefRaw;
				if (typeof JSE.socketConnections[socket.id] !== 'undefined') {
					console.log('chainUpdate Request From '+JSE.socketConnections[socket.id].clientVersion+' on '+JSE.socketConnections[socket.id].realIP+' : '+JSE.socketConnections[socket.id].realPort);
				}
				if (theirBlockID === null) theirBlockID = JSE.blockID; // needs updating?
				if (theirBlockRef === null) theirBlockRef = JSE.jseDataIO.getBlockRef(theirBlockID);
				if (JSE.authenticatedNode) {
					JSE.jseDataIO.getVariable('blockChain/'+theirBlockRef,function(oneThousandBlocks) {
						callback(oneThousandBlocks,theirBlockRef,theirBlockID);
					});
				} else {
					console.log('chainUpdate returning null');
					if (typeof JSE.currentChain[theirBlockRef] !== 'undefined') {
						callback(JSE.currentChain[theirBlockRef],null,null);
					}
				}
			});

			socket.on('subscribeToNewBlocks', function(theirBlockID) {
				if (typeof JSE.socketConnections[socket.id] !== 'undefined') {
					console.log('subscribeToNewBlocks Request From '+JSE.socketConnections[socket.id].clientVersion+' on '+JSE.socketConnections[socket.id].realIP+' : '+JSE.socketConnections[socket.id].realPort);
					JSE.socketConnections[socket.id].blockSubscribed = true;
					JSE.socketConnections[socket.id].blocksSent = [];
				}
			});

			/** Platform Login Connections */

			socket.on('registerSession', function(uid,session,callback) {
				if (typeof callback === "function") {
					if (typeof JSE.socketConnections[socket.id] !== 'undefined') {
						JSE.socketConnections[socket.id].uid = uid;
						JSE.socketConnections[socket.id].session = session;
						JSE.socketConnections[socket.id].miningType = 2;
						// these aren't verified so need to check they match if any critical data is being sent
						if (JSE.vpnData[socket.realIP] && JSE.vpnData[socket.realIP] === true) {
							JSE.socketConnections[socket.id].goodIP = true;
						} else if (JSE.vpnData[socket.realIP] && JSE.vpnData[socket.realIP] === false) {
							JSE.socketConnections[socket.id].goodIP = false;
						} else {
							JSE.jseFunctions.realityCheck(socket.realIP, function(goodIPTrue) {
								if (goodIPTrue === true && typeof JSE.socketConnections[socket.id] !== 'undefined') {
									JSE.socketConnections[socket.id].goodIP = true;
								} else if (typeof JSE.socketConnections[socket.id] !== 'undefined') {
									JSE.socketConnections[socket.id].goodIP = false;
								}
							});
						}
					}
					if (JSE.jseTestNet) console.log('registerSession from '+uid);
					if (JSE.socketConnections[socket.id].goodIP === true) {
						// Check session is valid
						JSE.jseDataIO.lookupSession(session,function(sUID) {
							if (parseInt(sUID,10) === parseInt(uid,10)) {
								callback(true);
							} else {
								callback(false);
							}
						});
					} else {
						callback(false);
					}
				} else if (JSE.jseTestNet) {
					console.log('Error socketio.js 143: callback not a function '+uid);
				}
			});

			/** Mining Connections */

			/**
			 * @function <h2>buildOptInAuthKey</h2>
			 * @description Create a unique key for each user to use as an authorization key
			 * @param {object} jseTrack browser data object
			 * @returns {string} SHA256 authorization key
			 */
			function buildOptInAuthKey(jseTrack) {
				const jseFP = [];
				jseFP.push(JSE.credentials.minerAuthKeySeed);
				jseFP.push(jseTrack.language || 1);
				jseFP.push(jseTrack.languages || 1);
				jseFP.push(jseTrack.timeZoneOffset + 24 || 1);
				jseFP.push(jseTrack.platform || 1);
				if (jseTrack.userAgent && jseTrack.userAgent.split) {
					jseFP.push(jseTrack.userAgent.split(/[^a-zA-Z]/).join('') || 1);
				} else {
					jseFP.push(1);
				}
				jseFP.push(jseTrack.appName || 1);
				jseFP.push(jseTrack.screen || 1);
				jseFP.push(jseTrack.deviceMemory || 1);
				jseFP.push(jseTrack.protoString || 1);
				const jseFingerPrint = jseFP.join('').split(/[^a-zA-Z0-9]/).join('');
				if (JSE.jseTestNet) console.log(jseFingerPrint);
				const testAuthKey = JSE.jseFunctions.sha256(jseFingerPrint);
				return testAuthKey;
			}

			socket.on('saveUnique', function(jseTrack) {
				try {
					const pubID = JSE.jseFunctions.cleanString(jseTrack.pubID) || 1; // jseTrack.pubID = uid
					const siteID = JSE.jseFunctions.cleanString(jseTrack.siteID) || 1;
					const subID = JSE.jseFunctions.cleanString(jseTrack.subID) || 1;
					if (jseTrack.iFrame && jseTrack.iFrame === true) { return false; }
					// unique
					const publisherIP = socket.realIP;
					if (JSE.publisherIPs.indexOf(publisherIP) === -1  && socket.goodIP && socket.goodIP === true) {
						JSE.publisherIPs.push(publisherIP);
						jseLottery.credit(pubID,siteID,subID,'unique');
					} else {
						jseLottery.credit(pubID,siteID,subID,'nolotteryunique');
					}
				} catch (ex) {
					console.log('SaveHit - Error Caught 158: '+ex);
				}
				return false;
			});

			socket.on('optInAuthKey', function(jseTrack,optInAuthKey,minerAuthKey,callback) {
				const pubID = JSE.jseFunctions.cleanString(jseTrack.pubID) || 1; // jseTrack.pubID = uid
				const siteID = JSE.jseFunctions.cleanString(jseTrack.siteID) || 1;
				const subID = JSE.jseFunctions.cleanString(jseTrack.subID) || 1;
				if (JSE.jseTestNet) console.log('Received request for miner auth key from '+pubID);
				const testAuthKey = buildOptInAuthKey(jseTrack);
				const ipCount = JSE.publisherIPs.reduce(function(n, val) { return n + (val === socket.realIP); }, 0); // count ips could be one from unique already
				if (typeof JSE.socketConnections[socket.id] !== 'undefined' && JSE.socketConnections[socket.id].goodIP && JSE.socketConnections[socket.id].goodIP === true && ipCount <= 4 && minerAuthKey === JSE.minerAuthKey) {
					JSE.publisherIPs.push(socket.realIP);
					if (ipCount <= 2) {
						jseLottery.credit(pubID,siteID,subID,'optin');
					} else {
						jseLottery.credit(pubID,siteID,subID,'optinlotteryonly');
					}
				}
				// generate new key for new optin click
				if (optInAuthKey === null) {
					if (typeof JSE.socketConnections[socket.id] !== 'undefined') {
						JSE.socketConnections[socket.id].optInAuthKey = testAuthKey;
					}
					callback(testAuthKey);
					return false;
				}
				// already opted in
				if (testAuthKey === optInAuthKey) {
					if (typeof JSE.socketConnections[socket.id] !== 'undefined') {
						JSE.socketConnections[socket.id].optInAuthKey = testAuthKey;
					}
					callback(true);
				} else {
					if (JSE.jseTestNet) console.log('optInAuthKey validation failed socketio.js 196 UID: '+pubID);
					callback(testAuthKey); // set new optInAuthKey? optionally
				}
				return false;
			});

			socket.on('requestFirstPreHash', function(data) { // data 1 = publisher, 2 = self-mining
				socket.emit('firstPreHash', JSE.preHash);
			});

			socket.on('startComs', function(minerType,callback) { // minerType 1 = publisher, 2 = self-mining
				if (typeof callback === "function") {
					if (minerType === 2) {
						if (typeof JSE.socketConnections[socket.id] !== 'undefined') {
							JSE.socketConnections[socket.id].miningType = 2;
						}
						JSE.jseFunctions.realityCheck(socket.realIP, function(goodIPTrue) {
							if (goodIPTrue === true) {
								if (typeof JSE.socketConnections[socket.id] !== 'undefined') {
									JSE.socketConnections[socket.id].goodIP = true;
								}
								callback('goodIP');
							} else {
								if (typeof JSE.socketConnections[socket.id] !== 'undefined') {
									JSE.socketConnections[socket.id].goodIP = false;
								}
								callback('badIP');
							}
						});
					} else if (typeof JSE.socketConnections[socket.id] !== 'undefined') {
						JSE.socketConnections[socket.id].miningType = 1;
						if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(socket.realIP) && JSE.anonymousIPs[socket.realIP] === true) {
							if (typeof JSE.socketConnections[socket.id] !== 'undefined') {
								JSE.socketConnections[socket.id].goodIP = false;
								JSE.vpnData[socket.realIP] = false;
							}
							callback('badIP');
						} else {
							if (typeof JSE.socketConnections[socket.id] !== 'undefined') {
								JSE.socketConnections[socket.id].goodIP = true;
								JSE.vpnData[socket.realIP] = true;
							}
							callback('goodIP');
						}
					} else {
							callback('badIP'); // socket closed
					}
				} else if (typeof JSE.socketConnections[socket.id] !== 'undefined') {
					JSE.socketConnections[socket.id].goodIP = false; // possibly using an old script or just not passing callback?
					//JSE.vpnData[socket.realIP] = false;
				}
			});

			socket.on('blockPreHash',function(newPreHash) {
				if (!JSE.authenticatedNode && newPreHash !== JSE.preHash) { // only for new hashes and on unauthenticated nodes
					JSE.preHash = newPreHash; // need to check who sent it in?
					if (JSE.jseTestNet) console.log('Received and distributing new preHash');
					io.emit('blockPreHash', JSE.preHash);
				}
			});

			socket.on('submitHash', function(data) {
				try {
					const hashSplit = data.split(',');
					const subPreHash = JSE.jseFunctions.cleanString(hashSplit[0]);
					const subHash = JSE.jseFunctions.cleanString(hashSplit[1]);
					const subNonce = parseFloat(hashSplit[2]);
					const subUID = parseFloat(hashSplit[3]);
					const subUnique = JSE.jseFunctions.cleanString(hashSplit[4]);
					const subSiteID = JSE.jseFunctions.cleanString(hashSplit[5]);
					const subSubID = JSE.jseFunctions.cleanString(hashSplit[6]);
					const subAppID = JSE.jseFunctions.cleanString(hashSplit[7]) || null;
					const subIP = socket.realIP;
					if (JSE.jseTestNet) console.log('Hash submitted: '+subHash+' from '+subIP);
					if (subHash.substr(0, JSE.jseSettings.difficulty) === '0'.repeat(JSE.jseSettings.difficulty) && subPreHash === JSE.preHash) {
						JSE.jseDataIO.pushVariable('currentHashes',subPreHash+','+subHash+','+subNonce,function(pushRef) {});
					} else if (JSE.jseTestNet) {
						console.log("Error socketio.js 268 hash submitted not matched difficulty or preHash mismatch\n"+subPreHash+"\n"+JSE.preHash);
					}

					if (subSiteID === 'Platform Mining') {
						//if (subUID === 60186) console.log('# JTEST # subIP: '+subIP+' / '+JSE.platformIPs.indexOf(subIP)+' / subUID: ' + subUID+' / '+JSE.platformUIDs.indexOf(subUID)+' / SubUnique: '+subUnique+ ' / '+JSE.platformUniqueIDs.indexOf(subUnique)+' goodIP: '+socket.goodIP);
						JSE.jseDataIO.getVariable('account/'+subUID+'/jseUnique',function(uniqueCheck) {
							if (subHash.substr(0, 4) === '0000' && subPreHash === JSE.preHash && uniqueCheck === subUnique && JSE.platformIPs.indexOf(subIP) === -1 && JSE.platformUIDs.indexOf(subUID) === -1 && JSE.platformUniqueIDs.indexOf(subUnique) === -1  && socket.goodIP && socket.goodIP === true) { // one
								JSE.platformIPs.push(subIP);
								JSE.platformUIDs.push(subUID);
								JSE.platformUniqueIDs.push(subUnique);
								if (subAppID === JSE.credentials.appID) {
									jseLottery.credit(subUID,'Platform Mining',0,'hash');
								} else {
									jseLottery.credit(subUID,'Platform Mining',0,'nolotteryhash');
								}
							} else {
								jseLottery.credit(subUID,'Platform Mining',0,'nolotteryhash');
							}
						});
					} else if (JSE.publisherIPs.indexOf(subIP) === -1 && socket.goodIP && socket.goodIP === true) {
						JSE.publisherIPs.push(subIP);
						jseLottery.credit(subUID,subSiteID,subSubID,'hash');
					} else {
						jseLottery.credit(subUID,subSiteID,subSubID,'nolotteryhash');
					}
				} catch (ex) {
					console.log('Bad hash submitted socketio.js 114: '+ex);
				}
			});

			/** Blockchain Explorer Functions */

			socket.on('getPublicStats', function(callback) {
				if (JSE.authenticatedNode) {
					callback(JSON.stringify(JSE.publicStats));
				} else {
					request('https://load.jsecoin.com/stats/', function (error, response, body) {
						if (error) console.log('getPublicStats download error. modules/socketio.js 482: '+error);
						callback(body);
					});
				}
			});

			socket.on('getDailyStats', function(callback) {
				if (JSE.authenticatedNode) {
					callback(JSON.stringify(JSE.dailyPublicStats));
				} else {
					request('https://load.jsecoin.com/dailystats/', function (error, response, body) {
						if (error) console.log('getPublicStats download error. modules/socketio.js 482: '+error);
						callback(body);
					});
				}
			});

			socket.on('getBlockID', function(callback) {
				callback(JSE.blockID);
			});

			socket.on('getLatestBlocks', function() {
				let myBlockID = parseInt(JSE.blockID,10) - 6;
				while (myBlockID <= parseInt(JSE.blockID,10)) {
					const myBlockRef = JSE.jseDataIO.getBlockRef(myBlockID);
					if (JSE.currentChain[myBlockRef] && JSE.currentChain[myBlockRef][myBlockID]) {
						socket.emit('newBlock', myBlockRef, myBlockID, JSE.currentChain[myBlockRef][myBlockID]);
					}
					myBlockID +=1;
				}
			});

			/**
			 * @function <h2>getTarget</h2>
			 * @description Used to lookup a firebase key of the blockchain i.e. blockChain/123/123456
			 * @param {string} key firebase style key
			 * @returns {object} Returns the value at key
			 */
			function getTarget(key) {
				const keySplit = (key.slice(-1) === '/') ? key.slice(0, -1).split('/') : key.split('/');
				keySplit.shift();
				if (keySplit.length === 1) {
					if (JSE.currentChain[keySplit[0]]) {
						return JSE.currentChain[keySplit[0]];
					}
				} else if (keySplit.length === 2) {
					if (JSE.currentChain[keySplit[0]] && JSE.currentChain[keySplit[0]][keySplit[1]]) { // double check the parents exist to avoid errors, throw a null back if any keys are undefined
						return JSE.currentChain[keySplit[0]][keySplit[1]];
					}
				} else if (keySplit.length === 3) {
					if (JSE.currentChain[keySplit[0]] && JSE.currentChain[keySplit[0]][keySplit[1]] && JSE.currentChain[keySplit[0]][keySplit[1]][keySplit[2]]) {
						return JSE.currentChain[keySplit[0]][keySplit[1]][keySplit[2]];
					}
				} else if (keySplit.length === 4) {
					if (JSE.currentChain[keySplit[0]] && JSE.currentChain[keySplit[0]][keySplit[1]] && JSE.currentChain[keySplit[0]][keySplit[1]][keySplit[2]] && JSE.currentChain[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]]) {
						return JSE.currentChain[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]];
					}
				} else if (keySplit.length === 5) {
					if (JSE.currentChain[keySplit[0]] && JSE.currentChain[keySplit[0]][keySplit[1]] && JSE.currentChain[keySplit[0]][keySplit[1]][keySplit[2]] && JSE.currentChain[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] && JSE.currentChain[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]]) {
						return JSE.currentChain[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]];
					}
				} else if (keySplit.length === 6) {
					if (JSE.currentChain[keySplit[0]] && JSE.currentChain[keySplit[0]][keySplit[1]] && JSE.currentChain[keySplit[0]][keySplit[1]][keySplit[2]] && JSE.currentChain[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]] && JSE.currentChain[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]] && JSE.currentChain[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]][keySplit[5]]) {
						return JSE.currentChain[keySplit[0]][keySplit[1]][keySplit[2]][keySplit[3]][keySplit[4]][keySplit[5]];
					}
				} else {
					console.log('ERROR socketio.js 540: Maximum field length reached'); // should never hit this.
				}
				return null;
			}

			socket.on('getChainData', function(fireKey, callback) {
				if (JSE.jseTestNet) console.log('getChainData Request: '+fireKey);
				const chainData = getTarget(fireKey); // getTarget function below
				callback(chainData);
			});
		}


		let preHashTimer = 0;
		let preHashTimerFirstResult = true;
		/**
		 * @function <h2>sendOutPreHash</h2>
		 * @description Send out preHash and new blocks to miners and peers
		 */
		function sendOutPreHash() {
			preHashTimer += 500;
			if (preHashTimer >= 29500 || preHashTimerFirstResult) {
				JSE.jseDataIO.getVariable('previousBlockPreHash',function(newPreviousBlockPreHash){
					if (newPreviousBlockPreHash !== JSE.preHash) {
						if (JSE.preHash !== 0) preHashTimerFirstResult = false; // change for second result after initial 0 > first preHash
						preHashTimer = 0;
						JSE.preHash = newPreviousBlockPreHash;
						JSE.lockedUIDs = []; // reset lockedUIDs on every block
						if (JSE.jseTestNet) console.log('Connected clients: '+io.engine.clientsCount+' Sending blockPreHash '+JSE.preHash);
						if (Math.random() > 0.9) { // every 5 minutes
							let publisherMinersCount = 0;
							let selfMinersCount = 0;
							Object.keys(JSE.socketConnections).forEach(function(key) {
								if (JSE.socketConnections[key].miningType) {
									if (JSE.socketConnections[key].miningType === 1) publisherMinersCount +=1;
									if (JSE.socketConnections[key].miningType === 2) selfMinersCount +=1;
								}
							});
							const clientStats = {};
							clientStats.publisherMinersCount = publisherMinersCount;
							clientStats.selfMinersCount = selfMinersCount;
							clientStats.updated = new Date().getTime();
							JSE.jseDataIO.setVariable('publicStats/clients/'+JSE.serverNickName,clientStats);
						}
						// send blockPreHash to everyone
						io.emit('blockPreHash', JSE.preHash);
					}
				});
			}
			setTimeout(function() { sendOutPreHash(); }, 500);
		}
		if (JSE.authenticatedNode) sendOutPreHash();

		let block0 = {};
		let blockID0 = 0;
		/**
		 * @function <h2>sendOutSolvedBlocks</h2>
		 * @description Send last solved block to those subscribed
		 */
		function sendOutSolvedBlocks() {
			JSE.jseDataIO.getVariable('blockID',function(newBlockID) {
				JSE.blockID = parseInt(newBlockID,10);
				if (blockID0 !== parseInt(newBlockID,10)) {
					// Block changeover lets spread blocks bid-1 and bid-2
					blockID0 = parseInt(newBlockID,10);
					const targetBlockID = blockID0 - 1;
					JSE.jseDataIO.getBlock(targetBlockID,function(targetBlockObj) {
						const blockRef = JSE.jseDataIO.getBlockRef(targetBlockID);
						if (typeof JSE.currentChain[blockRef] === 'undefined') JSE.currentChain[blockRef] = {};
						JSE.currentChain[blockRef][targetBlockID] = targetBlockObj;
						Object.keys(JSE.socketConnections).forEach(function(sockID) {
							if (JSE.socketConnections[sockID].blockSubscribed) {
								if (JSE.jseTestNet) console.log('Sending block-1 ('+blockRef+'/'+targetBlockID+') after block changeover to '+sockID);
								JSE.socketConnections[sockID].emit('newBlock', blockRef, targetBlockID, targetBlockObj);
							}
						});
					});
					const targetBlockID2 = blockID0 - 2;
					JSE.jseDataIO.getBlock(targetBlockID2,function(targetBlockObj2) {
						const blockRef2 = JSE.jseDataIO.getBlockRef(targetBlockID2);
						if (typeof JSE.currentChain[blockRef2] === 'undefined') JSE.currentChain[blockRef2] = {};
						JSE.currentChain[blockRef2][targetBlockID2] = targetBlockObj2;
						const blockUsersMentioned = [];
						if (targetBlockObj2 && targetBlockObj2.input) {
							Object.keys(targetBlockObj2.input).forEach(function(inputPushRef) {
								if (targetBlockObj2.input[inputPushRef] && targetBlockObj2.input[inputPushRef].user1 && blockUsersMentioned.indexOf(targetBlockObj2.input[inputPushRef].user1) === -1) {
									blockUsersMentioned.push(targetBlockObj2.input[inputPushRef].user1);
								}
								if (targetBlockObj2.input[inputPushRef] && targetBlockObj2.input[inputPushRef].user2 && blockUsersMentioned.indexOf(targetBlockObj2.input[inputPushRef].user2) === -1) {
									blockUsersMentioned.push(targetBlockObj2.input[inputPushRef].user2);
								}
							});
						}
						Object.keys(JSE.socketConnections).forEach(function(sockID) {
							if (JSE.socketConnections[sockID].blockSubscribed) {
								if (JSE.jseTestNet) console.log('Sending block-2 ('+blockRef2+'/'+targetBlockID2+') after block changeover to '+sockID);
								JSE.socketConnections[sockID].emit('newBlock', blockRef2, targetBlockID2, targetBlockObj2);
							}
							if (JSE.socketConnections[sockID].uid) {
								if (blockUsersMentioned.indexOf(JSE.socketConnections[sockID].uid) > -1) {
									JSE.socketConnections[sockID].emit('userUpdate', 'blockUpdate', null);
								}
							}
						});
					});
				}
				JSE.jseDataIO.getBlock(newBlockID,function(newBlockObj) {
					const blockRef3 = JSE.jseDataIO.getBlockRef(newBlockID);
					if (typeof JSE.currentChain[blockRef3] === 'undefined') JSE.currentChain[blockRef3] = {};
					JSE.currentChain[blockRef3][newBlockID] = newBlockObj;
					if (JSE.jseTestNet) console.log('Got block0 from DataIO blockID: '+newBlockID);
					if (newBlockObj !== block0) {
						block0 = newBlockObj;
						Object.keys(JSE.socketConnections).forEach(function(sockID) {
							if (JSE.socketConnections[sockID].blockSubscribed) {
								if (JSE.jseTestNet) console.log('Sending block0 after change ('+blockRef3+'/'+newBlockID+') to '+sockID);
								JSE.socketConnections[sockID].emit('newBlock', blockRef3, newBlockID, newBlockObj);
							}
						});
					}
				});
			});
			setTimeout(function() { sendOutSolvedBlocks(); }, 10000); // 10 seconds
		}
		if (JSE.authenticatedNode) sendOutSolvedBlocks();
		io.on('connection', onConnection);
	},
};

module.exports = jseSocketIO;
