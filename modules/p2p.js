/**
 * @module jsePeerConnections
 * @description Client connects to initial peer set in server.js and requests a peerList (plus blockID&jseSettings).<br>
 * Then it will connect to 3 peers (definable in JSE.maxPeers with -m command line arg) that are first to respond<br>
 * It then requests the last 1000 blocks (litenode) or the entire blockChain (fullnode)<br>
 * Then it subscribes to any new blocks and transactions coming in on the network<br>
 * New blocks received are validated and checked before being assigned to the JSE.currentChain
 * <h5>Exported</h5>
 * <ul><li>jsePeerConnections</li></ul>
*/

const JSE = global.JSE;
JSE.jsePeerConnections = {};

const fs = require('fs'); // only required temporarily for testing

const consensusMajority = (JSE.jseTestNet) ? 1 : (JSE.maxPeers / 2); // set consensus majority to one for testnet
if (JSE.jseTestNet) console.log('Consensus requirement set at '+consensusMajority);
let activePeerCount = 0;

if (JSE.jseTestNet) console.log('Connecting to '+JSE.peerList["0"].server+':'+JSE.peerList["0"].port+' to request peerList');
const ioclient = require('socket.io-client'); // for peer client connections

const seedPeerURL = (JSE.peerList["0"].port === 443) ? 'https://'+JSE.peerList["0"].server+':443' : 'http://'+JSE.peerList["0"].server+':'+JSE.peerList["0"].port;
const socketclient = ioclient.connect(seedPeerURL, {
	reconnect: false, transports: ["websocket"], heartbeatTimeout: 1800000, maxHttpBufferSize: 1000000000,
}); // connects to host defined in server.js

let possibleChains = [];
let possibleBlocks = {};
let timeoutTimer = {};

/**
 * @function <h2>subscribeToNewBlocks</h2>
 * @description Send subscribeToNewBlocks request to a peer
 * @param {object} sockID Peers socket ID
 */
function subscribeToNewBlocks(sockID) {
	if (JSE.jsePeerConnections[sockID].active && JSE.jsePeerConnections[sockID].activePeerCount <= JSE.maxPeers) { // only connect to first 3 peers to respond
		if (JSE.jseTestNet) console.log('Subscribing to new blocks on server '+JSE.jsePeerConnections[sockID].peerURL);
		JSE.jsePeerConnections[sockID].emit('subscribeToNewBlocks', JSE.blockID);
	}
}

/**
 * @function <h2>fullNodeSync</h2>
 * @description Download entire blockchain, may take some time as blockchain data grows<br>
 */
function fullNodeSync() {
	const trustedPeers = [];
	Object.keys(JSE.jsePeerConnections).forEach(function(sockID) {
		if (JSE.jsePeerConnections[sockID].active && JSE.jsePeerConnections[sockID].trust >= 1) {
			trustedPeers.push(sockID);
		}
	});
	if (JSE.jseTestNet) console.log('Randomly selecting sync downloads from '+trustedPeers.length+' trusted peers');
	const highestBlockRef = JSE.jseDataIO.getBlockRef(JSE.blockID);
	for (let i = 0; i < highestBlockRef; i+=1) {
		const targetBlockID = JSE.blockID - (i * 1000) - 1000;
		const targetBlockRef = JSE.jseDataIO.getBlockRef(targetBlockID);
		const trustedPeerRef = trustedPeers[Math.floor(Math.random()*trustedPeers.length)]; // select a random trusted peer for each request
		if (JSE.jseTestNet) console.log('FullNode Sync: Downloading blockchain for blockRef: '+targetBlockRef+' from '+JSE.jsePeerConnections[trustedPeerRef].peerURL);
		JSE.jsePeerConnections[trustedPeerRef].emit('chainUpdate', targetBlockRef, targetBlockID, function(oneThousandBlocks,returnBlockRef,returnBlockID) {
			if (JSE.jseTestNet) console.log('Received FullNodeSync chainUpdate for blockRef: '+returnBlockRef);
			JSE.currentChain[returnBlockRef] = oneThousandBlocks;
		});
	}
}

/**
 * @function <h2>getPossibleBlocks</h2>
 * @description Request a chain update of the last 1000 blocks from the first 3 peers to respond.
 * @param {object} sockID Peers socket ID
 * @todo As the network grows it will be beneficial add more verification checks across a larger peer base
 */
function getPossibleBlocks(sockID) {
	if (JSE.jsePeerConnections[sockID].active && JSE.jsePeerConnections[sockID].activePeerCount <= JSE.maxPeers) { // only connect to first 3 peers to respond, least load perhaps
		if (JSE.authenticatedNode) {
			JSE.jseDataIO.getVariable('blockID',function(newBlockID) {
				JSE.blockID = newBlockID;
				const blockRef = JSE.jseDataIO.getBlockRef(JSE.blockID);
				JSE.jsePeerConnections[sockID].emit('chainUpdate', blockRef, JSE.blockID, function(oneThousandBlocks,forgetThisBlockRef,forgetThisBlockID) {
					if (oneThousandBlocks === null) return false; // blank reply standard
					if (JSE.jseTestNet) console.log('Received chainUpdate from peer blockRef: '+forgetThisBlockRef);
					possibleChains.push(oneThousandBlocks); // need to be careful as each peer will be pushing 10mbs of data
					subscribeToNewBlocks(sockID);
					return false;
				});
			});
		} else {
			// if not an authenticated node then use their blockID
			JSE.jsePeerConnections[sockID].emit('chainUpdate', null, null, function(oneThousandBlocks,newBlockRef,newBlockID) {
				if (oneThousandBlocks === null) return false; // blank reply standard
				if (JSE.jseTestNet) console.log('Received chainUpdate blockRef ('+newBlockRef+') and newBlockID ('+newBlockID+')');
				JSE.blockID = newBlockID;
				possibleChains.push(oneThousandBlocks); // need to be careful as each peer will be pushing 10mbs of data
				subscribeToNewBlocks(sockID);
				return false;
			});
		}
	}
}

/**
 * @function <h2>validatePossibleChains</h2>
 * @description Validate the blockChains received via consensus
 */
function validatePossibleChains() {
	if (JSE.jseTestNet) console.log('Validating '+possibleChains.length+' possibleChains received');
	for (let i = 0; i < possibleChains.length; i+=1) {
		const testChain = possibleChains[i];
		let chainMatches = 0; // count the number of matching chains
		for (let i2 = 0; i2 < possibleChains.length; i2+=1) {
			if (JSON.stringify(testChain) === JSON.stringify(possibleChains[i2])) chainMatches +=1;
		}
		if (JSE.jseTestNet) console.log('Validating... found '+chainMatches+' identical chains');
		if (chainMatches >= consensusMajority) { // consensus or majority of peers agree on current blockChain
			if (JSE.jseTestNet) console.log('Consensus reached, setting new blockchain as JSE.currentChain');
			Object.keys(possibleChains[i]).forEach(function(i3) { // eslint-disable-line
				const newBlockID = possibleChains[i][i3].blockID;
				const newBlockRef = JSE.jseDataIO.getBlockRef(newBlockID);
				if (typeof JSE.currentChain[newBlockRef] === 'undefined') JSE.currentChain[newBlockRef] = {};
				JSE.currentChain[newBlockRef][newBlockID] = possibleChains[i][newBlockID];
			});
			possibleChains = []; // reset
			return true; // do once
		}
		console.log('Consensus not reached - unable to validate chain');
	}
	possibleChains = []; // reset
	return false;
}

/**
 * @function <h2>validatePossibleBlocks</h2>
 * @description Validate the received blocks via consensus mechanism
 */
function validatePossibleBlocks() {
	Object.keys(possibleBlocks).forEach(function(bid) {
		for (let i = 0; i < possibleBlocks[bid].length; i+=1) {
			const testBlock = possibleBlocks[bid][i];
			let blockMatches = 0; // count the number of matching chains
			for (let i2 = 0; i2 < possibleBlocks[bid].length; i2+=1) {
				if (testBlock === possibleBlocks[bid][i2]) blockMatches +=1;
			}
			if (blockMatches >= consensusMajority) { // consensus or majority of peers agree
				if (JSE.blockID < bid) { JSE.blockID = bid; }
				const testBlockRef = JSE.jseDataIO.getBlockRef(bid);
				if (typeof JSE.currentChain[testBlockRef] === 'undefined') JSE.currentChain[testBlockRef] = {};
				let distrubteValidatedBlock = false;
				if (typeof JSE.currentChain[testBlockRef][bid] === 'undefined') {
					if (JSE.jseTestNet) console.log('Consensus reached, setting new blockID: '+bid);
					JSE.currentChain[testBlockRef][bid] = testBlock;
					distrubteValidatedBlock = true;
				} else if (JSE.currentChain[testBlockRef][bid] === testBlock) {
					if (JSE.jseTestNet) console.log('Consensus reached, on matching block ('+bid+')');
				} else if (typeof JSE.currentChain[testBlockRef][bid].signature !== 'undefined') {
					console.log('Trusted block does not match consensus blockID ('+bid+')');
				} else {
					if (JSE.jseTestNet) console.log('Consensus reached, overwriting blockID: '+bid);
					JSE.currentChain[testBlockRef][bid] = testBlock;
					distrubteValidatedBlock = true;
				}
				if (distrubteValidatedBlock === true) {
					// send out final block once to all subscribed peers
					Object.keys(JSE.socketConnections).forEach(function(sockID) {
						if (JSE.socketConnections[sockID].blockSubscribed) {
							if (JSE.jseTestNet) console.log('Distributing validated Block: ('+testBlockRef+' / '+bid+') to peer '+sockID);
							JSE.socketConnections[sockID].emit('newBlock', testBlockRef, bid, JSE.currentChain[testBlockRef][bid]);
						}
					});
				}
			}
		}
	});
	possibleBlocks = {};
}

/**
 * @function <h2>connectToPeers</h2>
 * @description Connect to a set of peers to start p2p network communications and start request block data
 */
function connectToPeers() {
	if (JSE.maxPeers === 0) return false;
	if (JSE.jseTestNet) console.log('Connecting to '+JSE.maxPeers+'/'+Object.keys(JSE.peerList).length+' peers');
	Object.keys(JSE.peerList).forEach(function(sockID1) {
		const peer = JSE.peerList[sockID1];
		if (peer.server === JSE.host && peer.port === JSE.port) {
			if (JSE.jseTestNet) console.log('Skipping connection to self');
		} else {
			const peerURL = (peer.port === 443) ? 'https://'+peer.server+':443' : 'http://'+peer.server+':'+peer.port;
			if (JSE.jseTestNet) console.log('Setting up P2P connection with: '+peerURL);
			JSE.jsePeerConnections[sockID1] = ioclient.connect(peerURL, {
				reconnect: true, transports: ["websocket"], heartbeatTimeout: 1800000, maxHttpBufferSize: 1000000000,
			});
			JSE.jsePeerConnections[sockID1].peerURL = peerURL;
			JSE.jsePeerConnections[sockID1].on('disconnect', function() {
				JSE.jsePeerConnections[sockID1] = null;
				delete JSE.jsePeerConnections[sockID1];
			});
			(function(sockID) { // eslint-disable-line
				JSE.jsePeerConnections[sockID].emit('helloWorld', JSE.jseVersion, JSE.host, JSE.port, function(peerVersion) {
					JSE.jsePeerConnections[sockID].active = true;
					JSE.jsePeerConnections[sockID].trust = 0; // setup a trust rating scheme
					activePeerCount +=1; // activePeerCount starts at 1 not 0
					JSE.jsePeerConnections[sockID].activePeerCount = activePeerCount;
					JSE.jsePeerConnections[sockID].clientVersion = peerVersion;
					if (peerVersion !== JSE.jseVersion) {
						getPossibleBlocks(sockID); // get the last < 1000 blocks i.e blockChain/123/123543 will send 543 blocks
					} else {
						console.log('Skipping and disconnecting from self '+peerVersion);
						JSE.jsePeerConnections[sockID].close();
					}
				});

				JSE.jsePeerConnections[sockID].on('blockPreHash', function(previousBlockPreHash) {
					setTimeout(function(previousBlockPreHash2) {
						const blockRef = JSE.jseDataIO.getBlockRef(JSE.blockID);
						if (typeof JSE.currentChain[blockRef] === 'undefined') JSE.currentChain[blockRef] = {};
						if (JSE.currentChain[blockRef][JSE.blockID-1] && JSE.currentChain[blockRef][JSE.blockID-1].preHash) {
							if (previousBlockPreHash2 === JSE.currentChain[blockRef][JSE.blockID-1].preHash) {
								if (JSE.jseTestNet) console.log('PreHash Confirmed - BlockID: '+(JSE.blockID-1));
							} else {
								console.log('PreHash Invalid - BlockID: '+(JSE.blockID-1));
							}
						} else {
							console.log('PreHash Missing - BlockID: '+(JSE.blockID-1));
						}
					}, 10000,previousBlockPreHash);
				});

				JSE.jsePeerConnections[sockID].on('newBlock', function(myBlockRef,myBlockID,myBlock) {
					if (JSE.jseTestNet) console.log('newBlock blockID: '+myBlockID+' received from '+JSE.jsePeerConnections[sockID].peerURL);
					const ignoreSignature = false;
					const trustedKey = '04d2d98f910f2fa570b127978b297b9de772efb67ce9dc510faf968c863a100e59087f6cd2fb4fae381d9aaca5180583a1d045740d105e944f5b740d668ae695c8';
					if (typeof JSE.currentChain[myBlockRef] === 'undefined') JSE.currentChain[myBlockRef] = {}; // set blockRef if not defined
					// Validate final bid-2 block on receipt
					if (ignoreSignature === false && typeof myBlock.signature !== 'undefined') {
						JSE.jsePeerConnections[sockID].lastSignatureReceived = myBlock.signature;
						JSE.jseFunctions.verifyHash(myBlock.hash, trustedKey, myBlock.signature, function() {
							// verified trustedKey with signed block
							JSE.currentChain[myBlockRef][myBlockID] = myBlock;
							if (JSE.blockID < myBlockID + 2) JSE.blockID = myBlockID + 2; // update blockID as signed block means we have bid-2
							console.log('Verified block and placed in JSE.currentChain/'+myBlockRef+'/'+myBlockID);
							const trustIncreaseTimeStamp = new Date().getTime(); // only increase trust per peer once every 30 seconds
							Object.keys(JSE.jsePeerConnections).forEach(function(sockID2) {
								if (JSE.jsePeerConnections[sockID2].lastSignatureReceived === myBlock.signature && (JSE.jsePeerConnections[sockID2].lastTrustIncrease || 0) < (trustIncreaseTimeStamp - 29000)) {
									JSE.jsePeerConnections[sockID2].lastTrustIncrease = trustIncreaseTimeStamp;
									JSE.jsePeerConnections[sockID2].trust +=1;
									if (JSE.peerList[sockID2]) JSE.peerList[sockID2].trust +=1;
									if (JSE.jseTestNet) console.log('Peer trust added to '+JSE.jsePeerConnections[sockID2].peerURL);
								}
							});
							// send out final block once to all subscribed peers
							Object.keys(JSE.socketConnections).forEach(function(sockID3) {
								if (JSE.socketConnections[sockID3].blockSubscribed && JSE.socketConnections[sockID3].blocksSent.indexOf(myBlockID) === -1) {
									JSE.socketConnections[sockID3].blocksSent.push(myBlockID); // don't send it twice to the same peer
									if (JSE.jseTestNet) console.log('Distributing newBlock: '+myBlockID+' to peer '+sockID3);
									JSE.socketConnections[sockID3].emit('newBlock', myBlockRef, myBlockID, JSE.currentChain[myBlockRef][myBlockID]);
								}
							});
						}, function() {
							console.log('block validation error p2p.js 118'); // failed to verify signature
						});
					} else {
						if (myBlockID > JSE.blockID + 2 || myBlockID < JSE.blockID - 4) {
							console.log('Block too old/new for myBlockID: '+myBlockID+' @ blockID: '+JSE.blockID+' from '+JSE.jsePeerConnections[sockID].peerURL);
						} else if (typeof JSE.currentChain[myBlockRef][myBlockID] !== 'undefined' && typeof JSE.currentChain[myBlockRef][myBlockID].signature !== 'undefined') {
							if (JSE.jseTestNet) console.log('Received duplicate final blockID: '+myBlockID+' from '+JSE.jsePeerConnections[sockID].peerURL);
						} else if (typeof possibleBlocks[myBlockID] === 'undefined') {
							possibleBlocks[myBlockID] = [];
						}
						if (typeof possibleBlocks[myBlockID] !== 'undefined') {
							possibleBlocks[myBlockID].push(myBlock);
							timeoutTimer = null;
							if (timeoutTimer !== null) {
								window.clearTimeout(timeoutTimer);
								timeoutTimer = null;
							} else {
								if (typeof timeoutTimer !== 'undefined') clearTimeout(timeoutTimer); // run once per 10 seconds
									timeoutTimer = setTimeout(function() {
									validatePossibleBlocks(); // loads it into JSE.currentChain
								}, 1000); // allow 1 second, delays blockchain explorer etc. Could maybe be optimised, previously 5 seconds
							}
						}
					}
				});
			})(sockID1);
		}
	}); // end for all peers loop

	setTimeout(function() {
		// validate and decide on what block to use.
		validatePossibleChains(); // loads it into JSE.currentChain
	}, 10000); // enough time to download blocks? 30 secs/10mb, should be fine. Could improve this.
	if (typeof JSE.jseFullNode !== 'undefined' && JSE.jseFullNode === true) {
		setTimeout(function() {
			fullNodeSync(); // sync full blockchain if set to JSE.jseFullNode = true; in ../server.js
		}, 90000); // start fullsync after 90 seconds, adjust this figure and adjust the trust figure on line 210
	}
	return false;
}

/** Request peer list on initial load */
socketclient.emit('peerList', JSE.peerList, JSE.jseVersion, JSE.host, JSE.port, function(newPeerList,newBlockID,newjseSettings){
	JSE.peerList = newPeerList;
	JSE.blockID = newBlockID;
	JSE.jseSettings = newjseSettings;
	if (JSE.jseTestNet) console.log('Received new peerList with '+Object.keys(JSE.peerList).length+' peers (bid:'+JSE.blockID+')');
	setTimeout(function() {
		//delete JSE.peerList["0"]; // remove the seed peer, save load on critical server
		connectToPeers(); // no peer2peer coms happen if the peerList isn't returned
	}, 1000);
	socketclient.disconnect();
});


module.exports = JSE.jsePeerConnections;
